import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Anchor } from "../shared/types.js";
type Point = { x: number; y: number };
export function ImageDetail({
  assetId,
  onClose,
  onExplore,
}: {
  assetId: string;
  onClose: () => void;
  onExplore: (region?: Anchor["region"]) => void;
}) {
  const image = useRef<HTMLImageElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [choosing, setChoosing] = useState(false);
  const [start, setStart] = useState<Point>();
  const [region, setRegion] = useState<Anchor["region"]>();
  useEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const point = (e: PointerEvent) => {
    const r = image.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };
  const move = (e: PointerEvent) => {
    if (!start) return;
    const end = point(e);
    setRegion({
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    });
  };
  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label="Image detail"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={onClose}
    >
      <button className="close" aria-label="Close image" onClick={onClose}>
        ×
      </button>
      <div className="lightbox-body" onClick={(e) => e.stopPropagation()}>
        <div
          className={"detail-image" + (choosing ? " choosing" : "")}
          onPointerDown={(e) => {
            if (!choosing) return;
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            setStart(point(e));
            setRegion(undefined);
          }}
          onPointerMove={move}
          onPointerUp={(e) => {
            move(e);
            setStart(undefined);
          }}
        >
          <img
            ref={image}
            src={"/api/assets/" + assetId}
            alt="Enlarged illustration"
            draggable={false}
          />
          {region && (
            <div
              className="region-outline"
              style={{
                left: region.x * 100 + "%",
                top: region.y * 100 + "%",
                width: region.width * 100 + "%",
                height: region.height * 100 + "%",
              }}
            />
          )}
        </div>
        <div className="detail-controls">
          {!choosing ? (
            <>
              <button onClick={() => onExplore()}>
                Open this image as a book ↗
              </button>
              <button onClick={() => setChoosing(true)}>Choose a detail</button>
            </>
          ) : (
            <>
              <p>Drag across the detail you want to follow.</p>
              <button
                disabled={
                  !region || region.width < 0.005 || region.height < 0.005
                }
                onClick={() => onExplore(region)}
              >
                Open this detail as a book ↗
              </button>
              <button
                onClick={() => {
                  setChoosing(false);
                  setRegion(undefined);
                }}
              >
                Whole image
              </button>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
