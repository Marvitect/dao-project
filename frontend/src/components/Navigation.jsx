import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import { useAppKit } from '@reown/appkit/react';

const Navigation = ({ account, onConnect }) => {
  const { open } = useAppKit();

  return (
    <Navbar bg="light" expand="lg" className="my-3">
      <Container> {/* This limits the navbar width and centers it */}
        <Navbar.Brand href="#">MotionToken DAO</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="me-auto">
            <Nav.Item>
              <Link className="nav-link" to="/">
                Home
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link className="nav-link" to="/save-idea">
                Save Idea
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link className="nav-link" to="/fund-dao">
                Fund DAO
              </Link>
            </Nav.Item>
          </Nav>
          {account ? (
            <Navbar.Text>
              {`${account.slice(0, 6)}...${account.slice(-4)}`}
            </Navbar.Text>
          ) : (
            <button 
              onClick={() => open()}
              className="btn btn-primary"
            >
              Connect Wallet
            </button>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
