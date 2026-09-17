import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_1.png";
import img_2 from "./assets/images/image_2.png";
const Slide1: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    s: 1,
    x: 0,
    y: 0
  });
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / 1280, h / 720);
      setLayout({
        s,
        x: (w - 1280 * s) / 2,
        y: (h - 720 * s) / 2
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div id="slide-1" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-1" style={{
      position: "absolute",
      width: "1280px",
      height: "720px",
      overflow: "hidden",
      transformOrigin: "top left",
      color: "#000000",
      backgroundColor: "#ffffff",
      transform: `scale(${layout.s})`,
      left: layout.x + "px",
      top: layout.y + "px"
    }}><div key={0} style={{
        position: "absolute",
        left: "160px",
        top: "0px",
        width: "960px",
        height: "720px",
        boxSizing: "border-box",
        backgroundColor: "#4f81bd"
      }} /><div key={1} style={{
        position: "absolute",
        left: "593.89px",
        top: "89.4px",
        width: "486.99px",
        height: "541.2px",
        boxSizing: "border-box",
        backgroundColor: "rgba(128, 128, 128, 0.15)",
        clipPath: "path('M 28.6 328.1 C 28.6 328.1 28.6 328.1 70.73 328.1 C 73.37 328.1 75.92 330.03 77.19 333.18 C 77.19 333.18 77.19 333.18 98.3 381.65 C 99.67 384.67 99.67 388.54 98.3 391.56 C 98.3 391.56 98.3 391.56 77.19 440.04 C 75.92 443.18 73.37 445.12 70.73 445.12 C 70.73 445.12 70.73 445.12 28.6 445.12 C 25.87 445.12 23.41 443.18 22.05 440.04 C 22.05 440.04 22.05 440.04 1.02 391.56 C -0.34 388.54 -0.34 384.67 1.02 381.65 C 1.02 381.65 1.02 381.65 22.05 333.18 C 23.41 330.03 25.87 328.1 28.6 328.1 Z M 196.04 59.85 C 196.04 59.85 196.04 59.85 217.7 59.85 L 220.23 59.85 L 222.64 65.38 C 226 73.09 229.91 82.07 234.46 92.51 C 236.55 97.13 236.55 103.06 234.46 107.69 C 234.46 107.69 234.46 107.69 202.12 181.92 C 200.17 186.74 196.27 189.7 192.23 189.7 C 192.23 189.7 192.23 189.7 127.7 189.7 C 126.66 189.7 125.63 189.52 124.66 189.17 L 122.57 188 L 123.85 185.05 C 135.39 158.43 150.17 124.35 169.09 80.73 C 174.7 67.8 184.81 59.85 196.04 59.85 Z M 123.88 0 C 123.88 0 123.88 0 196.67 0 C 201.22 0 205.63 3.34 207.83 8.77 C 207.83 8.77 207.83 8.77 227.39 53.69 L 229.6 58.76 L 227.86 58.76 L 219.64 58.76 L 216.07 50.56 C 202.43 19.25 202.43 19.25 202.43 19.25 C 200.48 14.43 196.58 11.47 192.54 11.47 C 128.01 11.47 128.01 11.47 128.01 11.47 C 123.83 11.47 120.06 14.43 117.97 19.25 C 85.78 93.49 85.78 93.49 85.78 93.49 C 83.69 98.11 83.69 104.04 85.78 108.67 C 117.97 182.9 117.97 182.9 117.97 182.9 C 119.02 185.31 120.48 187.26 122.21 188.6 L 122.7 188.87 L 120.07 194.93 L 118.12 199.43 L 120.15 200.56 C 121.24 200.96 122.39 201.17 123.57 201.17 C 196.36 201.17 196.36 201.17 196.36 201.17 C 200.92 201.17 205.32 197.83 207.52 192.4 C 243.99 108.66 243.99 108.66 243.99 108.66 C 246.35 103.44 246.35 96.76 243.99 91.53 C 239.43 81.07 235.44 71.9 231.95 63.89 L 230.19 59.85 L 238.35 59.85 C 263.74 59.85 304.36 59.85 369.36 59.85 C 380.21 59.85 390.69 67.8 395.93 80.73 C 395.93 80.73 395.93 80.73 482.78 280.14 C 488.39 292.57 488.39 308.48 482.78 320.91 C 482.78 320.91 482.78 320.91 395.93 520.32 C 390.69 533.24 380.21 541.2 369.36 541.2 C 369.36 541.2 369.36 541.2 196.04 541.2 C 184.81 541.2 174.7 533.24 169.09 520.32 C 169.09 520.32 169.09 520.32 82.62 320.91 C 77 308.48 77 292.57 82.62 280.14 C 82.62 280.14 82.62 280.14 114.73 206.09 L 117.43 199.85 L 117.34 199.8 C 115.39 198.29 113.74 196.09 112.56 193.38 C 112.56 193.38 112.56 193.38 76.24 109.64 C 73.89 104.42 73.89 97.74 76.24 92.51 C 76.24 92.51 76.24 92.51 112.56 8.77 C 114.92 3.34 119.16 0 123.88 0 Z')"
      }} /><div key={2} style={{
        position: "absolute",
        left: "719.67px",
        top: "180.14px",
        width: "336.33px",
        height: "359.71px",
        boxSizing: "border-box",
        overflow: "hidden"
      }}><img src={img_1} alt="Picture 4" style={{
          position: "absolute",
          left: "0px",
          top: "0px",
          width: "839.06px",
          height: "359.71px",
          maxWidth: "none"
        }} /></div><div key={3} style={{
        position: "absolute",
        left: "130.78px",
        top: "68.1px",
        width: "896px",
        height: "184px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(32pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(32pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Times New Roman', Times, serif",
            fontWeight: "700",
            color: "#000000"
          }}>{"TITLE PAGE"}</span></p></div><div key={4} style={{
        position: "absolute",
        left: "34.78px",
        top: "-55.3px",
        width: "1088px",
        height: "218px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(40pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(40pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Garamond', sans-serif",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"SMART INDIA HACKATHON 2026"}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "0px",
        top: "148.04px",
        width: "694.79px",
        height: "614.83px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"Problem Statement ID \u2013 "}</span><span style={{
            fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"SIH26208"}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "2.4",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"Problem Statement Title- "}</span><span style={{
            fontSize: "calc(20pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"Student Innovation-Challenge your creative mind to conceptualize and develop unique toys and games based on our civilization, history, and culture etc."}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"Theme- "}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"Toys & Games"}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "2.4",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"PS Category- "}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"Software"}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "2.4",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"Team ID- "}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700",
            color: "#1f497d"
          }}>{"469"}</span></p><p style={{
          textAlign: "justify",
          lineHeight: "2.4",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontFamily: "Arial, 'Helvetica Neue', sans-serif",
            fontWeight: "700"
          }}>{"Team Name Beyonders"}</span></p></div><img key={6} src={img_2} alt="Picture 1" style={{
        position: "absolute",
        left: "1026.78px",
        top: "0.16px",
        width: "236.2px",
        height: "111.53px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide1;
