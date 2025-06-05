import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";

const Navigation = ({ account }) => {
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
          <Navbar.Text>{account}</Navbar.Text>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
