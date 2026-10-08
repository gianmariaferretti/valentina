import Image from "next/image";
import { getMediaAsset } from "@/data/media";
import { relationshipArtwork } from "@/data/relationship-artwork";
import styles from "./novel.module.css";

export function SceneArtwork({ slotId }: { readonly slotId: string }) {
  const slot = relationshipArtwork.find((item) => item.id === slotId);
  const background = slot?.backgroundMediaId
    ? getMediaAsset(slot.backgroundMediaId)
    : null;
  const valentina = slot?.valentinaMediaId
    ? getMediaAsset(slot.valentinaMediaId)
    : null;
  const gianmaria = slot?.gianmariaMediaId
    ? getMediaAsset(slot.gianmariaMediaId)
    : null;
  return (
    <div className={styles.artwork}>
      {background ? (
        <Image
          alt={background.alt}
          src={background.src}
          fill
          sizes="(max-width: 767px) 64px, 35vw"
          className={styles.backgroundArt}
        />
      ) : null}
      <div className={styles.characters}>
        {valentina ? (
          <Image
            alt={valentina.alt}
            src={valentina.src}
            width={220}
            height={280}
            sizes="(max-width: 767px) 28px, 15vw"
            className={styles.characterArt}
          />
        ) : (
          <span aria-label="Valentina artwork placeholder">V</span>
        )}
        {gianmaria ? (
          <Image
            alt={gianmaria.alt}
            src={gianmaria.src}
            width={220}
            height={280}
            sizes="(max-width: 767px) 28px, 15vw"
            className={styles.characterArt}
          />
        ) : (
          <span aria-label="Gianmaria artwork placeholder">G</span>
        )}
      </div>
      {!background && !valentina && !gianmaria ? (
        <small>
          V&amp;G / ARTWORK SLOT
          <br />
          {slotId}
        </small>
      ) : null}
    </div>
  );
}
