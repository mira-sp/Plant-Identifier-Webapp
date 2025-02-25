
'use client';
export default function FileUpload({ onUpload }) {
  return (
    <div className="w-full max-w-md p-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
        className="w-full p-2 border rounded"
      />
    </div>
  );
}
