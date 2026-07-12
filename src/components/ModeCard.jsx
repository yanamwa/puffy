import styles from "./ModeCard.module.css";

export default function ModeCard({ title, img, desc, onClick }) {
  return (
    <div className={styles.modeCard} onClick={onClick}>
      <img src={img} alt={title} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{desc}</p>
    </div>
  );
}