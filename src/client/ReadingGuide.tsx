import { useLayoutEffect, useRef, useState } from "react";
import { capturePlace, restorePlace } from "./position.js";
import { rememberReadingGuide } from "./tour-state.js";
const steps = [
  { target: ".book h1", title: "A world to wander through", text: "Read for as long as you like. A passage or picture can lead into another story, and your place will be waiting when you return." },
  { target: ".page-controls", title: "Find your own pace", text: "Scroll as usual, or use these arrows to move a screen at a time. At the end of the available story, Continue reading asks the book to unfold further." },
  { target: ".book p[data-block]", title: "Follow a few words", text: "Select a passage, then choose Open as a book to discover a narrative within it. Marked openings already have something ready to read." },
  { target: ".book .image-button", title: "There is more in a picture", text: "Tap an illustration to look closer. Open the whole image as a book, or choose a detail and draw a box around what interests you." },
  { target: ".type-controls", title: "Make yourself comfortable", text: "A− and A+ change the text size. Save place keeps a passage on your shelf. Your current reading position is remembered as you go." },
  { target: ".reader-navigation", title: "You can always come back", text: "The library holds your stories and saved places. When you follow an opening, Return brings you back to its exact source. Find this guide again with the ? beside the page arrows." },
];
type Rect = {top:number;left:number;width:number;height:number};
export function ReadingGuide({onClose}:{onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const [index,setIndex] = useState(0);
  const [rect,setRect] = useState<Rect>();
  const [cardTop,setCardTop] = useState(100);
  const available = useRef(steps.filter(s=>document.querySelector(s.target)));
  const step = available.current[index];
  const finish = () => {rememberReadingGuide();onClose();};
  useLayoutEffect(()=>{
    const element = dialog.current!;
    const book = document.querySelector<HTMLElement>(".book");
    const position = book ? capturePlace(book) : undefined;
    const previousY = window.scrollY;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    next.current?.focus({preventScroll:true});
    return ()=>{
      element.close();
      if(book&&position)restorePlace(book,position);else window.scrollTo(0,previousY);
      focus?.focus({preventScroll:true});
    };
  },[]);
  useLayoutEffect(()=>{
    const target = document.querySelector<HTMLElement>(step.target);
    if(!target)return;
    // The tour may reveal an illustration further down, but does not change the saved reading place.
    if(!target.closest(".reader-bar, .page-controls")) {
      const box=target.getBoundingClientRect();
      window.scrollBy({top:box.top-100,behavior:"instant"});
    }
    const measure=()=>{
      const box=target.getBoundingClientRect();
      const top=Math.max(8,box.top-6),left=Math.max(8,box.left-6);
      const bottom=Math.min(innerHeight-8,box.bottom+6),right=Math.min(innerWidth-8,box.right+6);
      setRect({top,left,width:Math.max(0,right-left),height:Math.max(0,bottom-top)});
      const height=card.current?.getBoundingClientRect().height??260;
      const below=bottom+18;
      setCardTop(below+height<innerHeight-16 ? below : top-height-18>=16 ? top-height-18 : Math.max(16,innerHeight-height-16));
    };
    measure();next.current?.focus({preventScroll:true});
    window.addEventListener("resize",measure);window.addEventListener("scroll",measure);
    const observer=new ResizeObserver(measure);observer.observe(target);if(card.current)observer.observe(card.current);
    return ()=>{observer.disconnect();window.removeEventListener("resize",measure);window.removeEventListener("scroll",measure);};
  },[step]);
  return <dialog ref={dialog} className="reading-guide" aria-labelledby="guide-title" aria-describedby="guide-description"
    onCancel={e=>{e.preventDefault();finish();}}
    onKeyDown={e=>{e.stopPropagation(); if(e.key==="ArrowRight"){e.preventDefault();if(index+1===available.current.length)finish();else setIndex(index+1);} if(e.key==="ArrowLeft"){e.preventDefault();setIndex(Math.max(0,index-1));}}}>
    {rect&&<div className="guide-spotlight" style={rect} aria-hidden="true"/>}
    <div className="guide-card" ref={card} style={{top:cardTop}}>
      <p className="eyebrow">A LITTLE ORIENTATION · {index+1} / {available.current.length}</p>
      <h2 id="guide-title">{step.title}</h2>
      <p id="guide-description">{step.text}</p>
      <div className="guide-actions">
        <button onClick={finish}>Skip guide</button>
        <div>{index>0&&<button onClick={()=>setIndex(index-1)}>Back</button>}
          <button ref={next} className="primary" onClick={()=>index+1===available.current.length?finish():setIndex(index+1)}>{index+1===available.current.length?"Begin reading":"Next"}</button>
        </div>
      </div>
    </div>
  </dialog>;
}
