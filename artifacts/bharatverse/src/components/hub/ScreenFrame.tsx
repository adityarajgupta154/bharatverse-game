export function ScreenFrame() {
  return (
    <div className="absolute inset-[6px] z-[45] pointer-events-none border border-primary/25">
      <div className="absolute top-0 left-0 w-[20px] h-[20px] border-t-[1.5px] border-l-[1.5px] border-primary/80" />
      <div className="absolute top-0 right-0 w-[20px] h-[20px] border-t-[1.5px] border-r-[1.5px] border-primary/80" />
      <div className="absolute bottom-0 left-0 w-[20px] h-[20px] border-b-[1.5px] border-l-[1.5px] border-primary/80" />
      <div className="absolute bottom-0 right-0 w-[20px] h-[20px] border-b-[1.5px] border-r-[1.5px] border-primary/80" />
    </div>
  );
}
