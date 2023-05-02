import React from "react";

const Card = () => {
  return (
    <div className="z-50 card card-compact w-full card-primary bg-accent shadow-xl">
      <figure>
        <img
          src="https://bootstrapmade.com/content/templatefiles/Arsha/Arsha-bootstrap-website-template-md.webp"
          alt="Shoes"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">Project Name</h2>
        <p>This is the description of this project</p>
        <div className="card-actions justify-end">
          <button className="btn">Github</button>
        </div>
      </div>
    </div>
  );
};

export default Card;
