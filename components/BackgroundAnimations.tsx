import { Leaf } from "lucide-react";

const BackgroundAnimations = () => {
  return (
    <div
      className="pixel-field fixed inset-x-0 top-0 bottom-auto overflow-hidden pointer-events-none z-0"
      style={{ height: "1200px" }}
      aria-hidden="true"
    >
      <div className="sonmun-line-field absolute inset-0">
        <span className="sonmun-line sonmun-line-1" />
        <span className="sonmun-line sonmun-line-2" />
        <span className="sonmun-line sonmun-line-3" />
        <span className="sonmun-line sonmun-line-4" />
        <span className="sonmun-line sonmun-line-5" />
        <span className="sonmun-line sonmun-line-6" />
        <span className="sonmun-line sonmun-line-7" />
        <span className="sonmun-line sonmun-line-8" />
        <span className="sonmun-line sonmun-line-9" />
        <span className="sonmun-line sonmun-line-10" />
        <span className="sonmun-line sonmun-line-11" />
        <span className="sonmun-line sonmun-line-12" />
        <span className="sonmun-line sonmun-line-13" />
        <span className="sonmun-line sonmun-line-14" />
      </div>
      <div className="sonmun-leaf-field absolute inset-0">
        <Leaf className="sonmun-leaf sonmun-leaf-1" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-2" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-3" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-4" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-5" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-6" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-7" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-8" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-9" strokeWidth={1.5} />
        <Leaf className="sonmun-leaf sonmun-leaf-10" strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default BackgroundAnimations;
