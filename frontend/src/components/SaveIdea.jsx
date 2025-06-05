import { useState } from "react";
import axios from "axios";

export default function SynopsisForm() {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("Submitting with:");
  console.log("Title:", title);
  console.log("Synopsis:", synopsis);

  const metadata = {
    pinataMetadata: { name: title },
    pinataContent: { title, synopsis },
  };

  try {
    // Call your backend proxy here, which handles the Pinata auth
    const res = await axios.post("http://localhost:4000/pinJSONToIPFS", metadata, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const cid = res.data.IpfsHash;
    const url = `https://ipfs.io/ipfs/${cid}`;
    console.log("Successfully uploaded to IPFS:", url);
    setIpfsUrl(url);
    setPreviewVisible(false);
  } catch (err) {
    console.error("IPFS upload error:", err);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          console.log("Updated title:", e.target.value);
        }}
        placeholder="Film Title"
        className="border p-2 w-full"
      />
      <textarea
        value={synopsis}
        onChange={(e) => {
          setSynopsis(e.target.value);
          console.log("Updated synopsis:", e.target.value);
        }}
        placeholder="Two-paragraph synopsis..."
        rows="6"
        className="border p-2 w-full"
      />
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Submit
        </button>
        <button
          type="button"
          onClick={() => {
            setPreviewVisible(!previewVisible);
            console.log("Toggled preview:", !previewVisible);
          }}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          {previewVisible ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {previewVisible && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h2 className="text-lg font-bold">Preview</h2>
          <h3 className="font-semibold mt-2">{title}</h3>
          <p className="mt-1 whitespace-pre-line">{synopsis}</p>
        </div>
      )}

      {ipfsUrl && (
        <div className="mt-4">
          <p>IPFS Link:</p>
          <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {ipfsUrl}
          </a>
        </div>
      )}
    </form>
  );
}
