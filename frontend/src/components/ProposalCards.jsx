import { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ethers } from 'ethers';

const ProposalCards = ({ proposals }) => {
  const [proposalData, setProposalData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!proposals || proposals.length === 0) {
      console.log("No proposals or empty array");
      setProposalData([]);
      return;
    }

    const normalizeUrl = (link) => {
      if (link.startsWith("ipfs://")) {
        return link.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      if (!link.startsWith("http")) {
        return `https://${link}`;
      }
      return link;
    };

   const fetchData = async () => {
  setLoading(true);
  const fetched = await Promise.all(
    proposals.map(async (proposal) => {
      const link = proposal.name; // <-- use the correct key here
      console.log("Fetching proposal from link:", link);

      if (!link || typeof link !== "string") {
        console.warn("Skipping proposal with invalid or missing link:", proposal);
        return {
          title: "Invalid Proposal",
          synopsis: "No valid link provided.",
          id: proposal.id || Math.random().toString(36).slice(2),
        };
      }

      try {
        const url = normalizeUrl(link);
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Failed to fetch ${url}, status: ${response.status}`);
          return {
            title: "Error loading",
            synopsis: `Failed to load proposal data (status ${response.status})`,
            id: proposal.id || link,
          };
        }

        const data = await response.json();
        console.log("Fetched data:", data);

        return {
          title: data.title || "Untitled",
          synopsis: data.synopsis || "No synopsis provided.",
          id: proposal.id || link,
        };
      } catch (err) {
        console.error("Error fetching proposal from IPFS:", err);
        return {
          title: "Error loading",
          synopsis: "Could not fetch proposal details.",
          id: proposal.id || link,
        };
      }
    })
  );
  setProposalData(fetched);
  setLoading(false);
};

    fetchData();
  }, [proposals]);

  if (!proposals || proposals.length === 0) return <p>No proposals found.</p>;
  if (loading) return <p>Loading proposals...</p>;

  return (
    <div style={{ marginTop: "3rem" }}>
      <h5>Proposal Details</h5>
      <Row xs={1} md={2} lg={3} className="g-4">
        {proposalData.map(({ id, title, synopsis }) => (
          <Col key={id}>
            <Card>
              <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Card.Text>{synopsis}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ProposalCards;