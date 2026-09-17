import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_5.png";
import img_2 from "./assets/images/image_2.png";
const Slide4: React.FC = () => {
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
  return <div id="slide-4" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-4" style={{
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
    }}><img key={0} src={img_1} alt="Picture 35" style={{
        position: "absolute",
        left: "2.14px",
        top: "114.17px",
        width: "622.04px",
        height: "328.5px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={1} style={{
        position: "absolute",
        left: "0px",
        top: "667.17px",
        width: "1280px",
        height: "52.83px",
        boxSizing: "border-box",
        backgroundColor: "#0070C0",
        boxShadow: "0px 2.41px 0px rgba(128, 128, 128, 0.35)"
      }} /><div key={2} style={{
        position: "absolute",
        left: "64px",
        top: "-5px",
        width: "1152px",
        height: "120px",
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
          fontSize: "calc(36pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(36pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Times New Roman', Times, serif",
            fontWeight: "700",
            color: "#000000"
          }}>{"FEASIBILITY AND VIABILITY"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "488px",
        top: "667.33px",
        width: "336.38px",
        height: "38.33px",
        boxSizing: "border-box",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'TradeGothic', sans-serif",
            color: "#FFFFFF"
          }}>{"@SIH Idea submission- Template"}</span></p></div><img key={4} src={img_2} alt="Picture 10" style={{
        position: "absolute",
        left: "1026.78px",
        top: "0.16px",
        width: "236.2px",
        height: "111.53px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={5} style={{
        position: "absolute",
        left: "622.04px",
        top: "166px",
        width: "630.82px",
        height: "253.24px",
        boxSizing: "border-box",
        backgroundColor: "#f3dcdb",
        borderRadius: "42.21px"
      }} /><div key={6} style={{
        position: "absolute",
        left: "800.68px",
        top: "171.11px",
        width: "252.83px",
        height: "67.86px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        whiteSpace: "nowrap",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            textDecoration: "underline",
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#953735"
          }}>{"TECHNICAL FEASIBILITY"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "622.04px",
        top: "208.57px",
        width: "640px",
        height: "77.55px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Working Web Prototype:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Developed using React, TypeScript, Vite and a custom HTML5 Canvas game engine."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "622.1px",
        top: "235.76px",
        width: "630.76px",
        height: "190.64px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"School-Ready Deployment:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Browser-based, no installation, touch/keyboard support and local progress saving."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Safe AI Assistance:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Multilingual interaction with verified facts and multi-layer child-safety filters."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Quality Assurance:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Automated type checks, world-data validation, gameplay-solvability checks and UI testing."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "626.5px",
        top: "433.62px",
        width: "630.76px",
        height: "221.87px",
        boxSizing: "border-box",
        backgroundColor: "#ebf1de",
        borderRadius: "36.98px"
      }} /><div key={10} style={{
        position: "absolute",
        left: "810.26px",
        top: "436.56px",
        width: "641.62px",
        height: "58.16px",
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
            textDecoration: "underline",
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#77933c"
          }}>{"ECONOMIC APPROACH"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "626.5px",
        top: "469.53px",
        width: "622.04px",
        height: "213.26px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"No specialized hardware or commercial game engine required"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{", making it affordable for schools"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Browser-based deployment"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0eliminates installation and maintenance expenses"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Reusable game architecture"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0enables new heritage regions to be added at a lower incremental cost"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Phased rollout through schools, CSR and government partnerships"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0supports sustainable nationwide scaling"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "138.21px",
        top: "123.1px",
        width: "370.2px",
        height: "38.78px",
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
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Risk Assessment and Mitigation"}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "95.51px",
        top: "174.12px",
        width: "171.38px",
        height: "63.01px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"PROBLEM"}</span><br /><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Inaccurate Heritage Information"}</span></p></div><div key={14} style={{
        position: "absolute",
        left: "395.88px",
        top: "175.4px",
        width: "209.59px",
        height: "72.7px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"SOLUTION"}</span><br /><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Reviewed Content +"}</span><br /><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Verified Facts Only"}</span><br /><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))"
          }}>{"Prevents misleading cultural learning"}</span></p></div><div key={15} style={{
        position: "absolute",
        left: "95.51px",
        top: "258.62px",
        width: "171.38px",
        height: "61.39px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"PROBLEM"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Child Safety &"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Privacy Risks"}</span></p></div><div key={16} style={{
        position: "absolute",
        left: "95.51px",
        top: "341.06px",
        width: "173.75px",
        height: "61.39px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"PROBLEM"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Low Connectivity &"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Basic School Devices"}</span></p></div><div key={17} style={{
        position: "absolute",
        left: "396.48px",
        top: "256.6px",
        width: "234.9px",
        height: "71.09px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"SOLUTION"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Multi-Layer Safety Filters"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"+ No Login Required"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(7pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(7pt * var(--pptx-font-scale, 1))"
          }}>{"Blocks PII, unsafe content and prompt injection"}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "396.48px",
        top: "340.8px",
        width: "223.86px",
        height: "71.09px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(8pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"SOLUTION"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Lightweight Browser Game"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"+ Local Progress Saving"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(7pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(7pt * var(--pptx-font-scale, 1))"
          }}>{"No installation; designed for school computers"}</span></p></div><div key={19} style={{
        position: "absolute",
        left: "33.94px",
        top: "18.17px",
        width: "149.7px",
        height: "93.52px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        borderRadius: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "center",
          lineHeight: "1.2",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            color: "#000000"
          }}>{"Beyonders"}</span></p></div><div key={20} style={{
        position: "absolute",
        left: "4.46px",
        top: "425.79px",
        width: "584.51px",
        height: "232.5px",
        boxSizing: "border-box",
        backgroundColor: "#c6daf1",
        borderRadius: "38.75px"
      }} /><div key={21} style={{
        position: "absolute",
        left: "4.46px",
        top: "516.12px",
        width: "622.04px",
        height: "151.87px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Static web hosting and lightweight\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Node.js server"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Stable internet connection for multilingual AI and voice assistance"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Verified heritage content, 2D game assets and narration audio"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Modern web browser;\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"no specialized GPU or commercial game engine required"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={22} style={{
        position: "absolute",
        left: "4.46px",
        top: "465.11px",
        width: "601.92px",
        height: "77.55px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Browser-enabled computer, laptop, tablet or smartphone"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"Open-source technologies:\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"React, TypeScript, Vite and HTML5 Canvas"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={23} style={{
        position: "absolute",
        left: "137.92px",
        top: "433.88px",
        width: "500.66px",
        height: "67.86px",
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
            textDecoration: "underline",
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#17375e"
          }}>{"RESOURCE REQUIREMENTS"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div></div></div>;
};
export default Slide4;
