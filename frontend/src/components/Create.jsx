import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { parseUnits, ethers } from "ethers";

const Create = ({ provider, dao, setIsLoading }) => {
  const [projectLink, setProjectLink] = useState("");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
const createHandler = async (e) => {
  e.preventDefault();

  if (!provider) {
    alert("Wallet provider not ready. Please wait or connect your wallet.");
    return;
  }

  try {
    setIsWaiting(true);

    const signer = await provider.getSigner();
    const daoWithSigner = dao.connect(signer);

    // Parse amount as uint256 BigInt (18 decimals assumed)
    const amountParsed = ethers.parseUnits(amount || "0", 18);

    // Call createProposal with your form inputs
    const tx = await daoWithSigner.createProposal(projectLink, amountParsed, address);

    // Wait for transaction to be mined
    await tx.wait();

    alert("Proposal created successfully!");
    setIsWaiting(false);

    // Optionally clear inputs or refresh UI here
    setProjectLink("");
    setAmount("");
    setAddress("");
  } catch (error) {
    console.error(error);
    alert("Error interacting with the contract");
    setIsWaiting(false);
  }
};

  return (
    <Form onSubmit={createHandler}>
      <Form.Group style={{ maxWidth: "450px", margin: "50px auto" }}>
        <Form.Control
          type="text"
          placeholder="enter project link"
          className="my-2"
          value={projectLink}
          onChange={(e) => setProjectLink(e.target.value)}
          required
        />
        <Form.Control
          type="number"
          placeholder="enter amount"
          className="my-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="any"
        />
        <Form.Control
          type="text"
          placeholder="enter address"
          className="my-2"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        {isWaiting ? (
          <Spinner
            animation="border"
            style={{ display: "block", margin: "0 auto" }}
          />
        ) : (
          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            Create Proposal
          </Button>
        )}
      </Form.Group>
    </Form>
  );
};

export default Create;
