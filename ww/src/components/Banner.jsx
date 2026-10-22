import Img from './Img';

// Big photo banner used at the top of inner pages
export default function Banner({ img, title, sub }) {
  return (
    <section className="pbanner">
      <Img src={img} alt={title} />
      <div className="pb-txt">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}