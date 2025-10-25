export function ImagePreview({ file }) {
    if (!file) return null;

    const url = URL.createObjectURL(file);

    return (
      <div className="border rounded-md overflow-hidden w-80 h-80 flex items-center justify-center bg-gray-100 text-black">
        <img src={url} alt="Uploaded preview" className="object-contain w-full h-full text-black" />
      </div>
    );
  }
