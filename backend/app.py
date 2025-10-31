from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import os
import uuid
from recipe_api import dish_router

app = FastAPI()
app.include_router(dish_router, prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model("model4.keras")

class_names = [
    'FreshApple', 'FreshBanana', 'FreshCarrot',
    'FreshCucumber', 'FreshMango', 'FreshOrange', 'FreshPotato',
    'FreshStrawberry', 'FreshTomato', 'RottenApple', 'RottenBanana',
    'RottenCarrot', 'RottenCucumber', 'RottenMango',
    'RottenOrange', 'RottenPotato', 'RottenStrawberry', 'RottenTomato'
]

uploaded_image = {"image_bytes": None, "original_image": None}

PATCHES_DIR = "patches"
os.makedirs(PATCHES_DIR, exist_ok=True)
current_patches = {"patches": []}

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file).convert("RGB")
        uploaded_image["original_image"] = image.copy()
        img_resized = image.resize((128, 128))
        img_bytes = io.BytesIO()
        img_resized.save(img_bytes, format="PNG")
        img_bytes.seek(0)
        uploaded_image["image_bytes"] = img_bytes

        return {"message": "Image uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

@app.get("/display/")
async def display_image():
    if uploaded_image["image_bytes"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")
    uploaded_image["image_bytes"].seek(0)
    return StreamingResponse(uploaded_image["image_bytes"], media_type="image/png")

@app.get("/predict/")
async def predict_image():
    if uploaded_image["original_image"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    img = uploaded_image["original_image"].resize((128, 128))
    arr = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    arr = tf.expand_dims(arr, 0)
    pred = model.predict(arr)
    top_idx = np.argmax(pred[0])
    top_prob = float(pred[0][top_idx])
    top_label = class_names[top_idx]

    return JSONResponse({
        "predictions": [{
            "bbox": None,
            "label": top_label,
            "confidence": top_prob
        }]
    })

@app.get("/predict_many/")
async def predict_many(threshold: float = 0.6, max_patches: int = 8):
    if uploaded_image["original_image"] is None:
        raise HTTPException(status_code=404, detail="No uploaded image found")

    img = uploaded_image["original_image"]
    width, height = img.size
    patch_size = min(width, height) // 2
    stride = patch_size
    predictions = []
    patches_info = []
    count = 0
    for patch in current_patches["patches"]:
        try:
            os.remove(patch["path"])
        except:
            pass
    current_patches["patches"] = []

    for y in range(0, height - patch_size + 1, stride):
        for x in range(0, width - patch_size + 1, stride):
            if count >= max_patches:
                break

            # Crop and resize patch
            crop = img.crop((x, y, x + patch_size, y + patch_size))
            crop_resized = crop.resize((128, 128))

            patch_filename = f"patch_{count}_{uuid.uuid4().hex[:8]}.png"
            patch_path = os.path.join(PATCHES_DIR, patch_filename)
            crop.save(patch_path)

            patch_info = {
                "id": count,
                "filename": patch_filename,
                "path": patch_path,
                "bbox": [x, y, x + patch_size, y + patch_size],
            }
            patches_info.append(patch_info)

            arr = tf.keras.preprocessing.image.img_to_array(crop_resized) / 255.0
            arr = tf.expand_dims(arr, 0)

            try:
                pred = model.predict(arr, verbose=0)
                top_idx = np.argmax(pred[0])
                top_prob = float(pred[0][top_idx])

                prediction = {
                    "patch_id": count,
                    "bbox": [x, y, x + patch_size, y + patch_size],
                    "label": class_names[top_idx],
                    "confidence": top_prob,
                    "patch_url": f"/patches/{patch_filename}",
                    "below_threshold": top_prob < threshold,
                }

                predictions.append(prediction)
                count += 1
            except Exception as e:
                print(f"Prediction error: {e}")
                continue

        if count >= max_patches:
            break

    while len(predictions) < max_patches and len(predictions) > 0:
        copy_pred = predictions[-1].copy()
        copy_pred["patch_id"] = len(predictions)
        predictions.append(copy_pred)

    current_patches["patches"] = patches_info

    return JSONResponse({
        "predictions": predictions,
        "total_patches": len(predictions),
        "patches_above_threshold": len([p for p in predictions if not p["below_threshold"]]),
    })


@app.get("/patches/{filename}")
async def get_patch(filename: str):
    patch_path = os.path.join(PATCHES_DIR, filename)
    if not os.path.exists(patch_path):
        raise HTTPException(status_code=404, detail="Patch not found")

    with open(patch_path, "rb") as f:
        return StreamingResponse(io.BytesIO(f.read()), media_type="image/png")


