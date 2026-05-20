// SubFunctionDetailSkeleton.tsx
import { Col, Row } from "react-bootstrap";

const SubFunctionSkeleton = () => {
  return (
    <div className="py-3 px-4 form-app mb-5 placeholder-glow">
      {/* Function */}
      <div className="mb-5">
        <span className="placeholder col-3 mb-2"></span>
        <div className="placeholder col-6" style={{ height: 38 }}></div>
      </div>

      <Row>
        <Col>
          <span className="placeholder col-4 mb-2"></span>
          <div className="placeholder col-12" style={{ height: 38 }}></div>
        </Col>
        <Col>
          <span className="placeholder col-5 mb-2"></span>
          <div className="placeholder col-12" style={{ height: 38 }}></div>
        </Col>
      </Row>

      <div className="mt-3">
        <span className="placeholder col-3 mb-2"></span>
        <div className="placeholder col-12" style={{ height: 90 }}></div>
      </div>
    </div>
  );
};

export default SubFunctionSkeleton;
