import tensorflow as tf
import numpy as np
from tensorflow.keras.models import load_model
import os

model = load_model("model4_v2_fixed.keras", compile=False)

class_names = [
    'FreshApple', 'FreshBanana', 'FreshCarrot',
    'FreshCucumber', 'FreshMango', 'FreshOrange', 'FreshPotato',
    'FreshStrawberry', 'FreshTomato', 'RottenApple', 'RottenBanana',
    'RottenCarrot', 'RottenCucumber', 'RottenMango',
    'RottenOrange', 'RottenPotato', 'RottenStrawberry', 'RottenTomato'
]


def predict_single_image(image_pil):
    img = image_pil.resize((128, 128))
    arr = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    arr = tf.expand_dims(arr, 0)
    pred = model.predict(arr, verbose=0)
    top_idx = np.argmax(pred[0])

    return {
        "label": class_names[top_idx],
        "confidence": float(pred[0][top_idx]),
        "bbox": None
    }