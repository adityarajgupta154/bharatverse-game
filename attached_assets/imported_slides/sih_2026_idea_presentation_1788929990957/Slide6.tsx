import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_2.png";
const Slide6: React.FC = () => {
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
  return <div id="slide-6" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-6" style={{
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
        left: "683.54px",
        top: "154.11px",
        width: "507.69px",
        height: "227.37px",
        boxSizing: "border-box",
        backgroundColor: "#dce6f2",
        borderRadius: "37.9px"
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
          }}>{"RESEARCH  AND REFERENCES"}</span></p></div><div key={3} style={{
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
          }}>{"@SIH Idea submission- Template"}</span></p></div><img key={4} src={img_1} alt="Picture 11" style={{
        position: "absolute",
        left: "1026.78px",
        top: "0.16px",
        width: "236.2px",
        height: "111.53px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={5} style={{
        position: "absolute",
        left: "34.62px",
        top: "154.11px",
        width: "507.69px",
        height: "227.37px",
        boxSizing: "border-box",
        backgroundColor: "#fdeadb",
        borderRadius: "37.9px"
      }} /><div key={6} style={{
        position: "absolute",
        left: "114.53px",
        top: "153.72px",
        width: "568.42px",
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
            textDecoration: "underline",
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#e46c0a"
          }}>{"SUPPORTING RESEARCH PAPERS"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "34.62px",
        top: "200.19px",
        width: "524.63px",
        height: "200.34px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif"
          }}>{"Clark, D. B., Tanner-Smith, E. E., & Killingsworth, S. S. (2016).\xA0Digital Games, Design, and Learning: A Systematic Review and Meta-Analysis. Review of Educational Research."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif"
          }}>{"Mortara, M., Catalano, C. E., Bellotti, F., et al. (2014).\xA0Learning Cultural Heritage by Serious Games. Journal of Cultural Heritage."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif"
          }}>{"UNICEF.\xA0Policy Guidance on AI for Children."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif"
          }}>{"UNESCO. (2023).\xA0Guidance for Generative AI in Education and Research."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif"
          }}>{"Government of India. (2020).\xA0National Education Policy 2020."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(9pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "838.14px",
        top: "146.87px",
        width: "494.32px",
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
          }}>{"DATA SOURCES"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "683.54px",
        top: "180.8px",
        width: "592px",
        height: "232.65px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"NCERT Textbooks\xA0\u2014 Indian history and age-appropriate educational content"}</span><br /><a href="https://ncert.nic.in/textbook.php" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://ncert.nic.in/textbook.php"}</a></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"UNESCO World Heritage Centre\xA0\u2014 Mohenjo-daro and Nalanda Mahavihara"}</span><br /><a href="https://whc.unesco.org/" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://whc.unesco.org/"}</a></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Archaeological Survey of India\xA0\u2014 Archaeological and monument information"}</span><br /><a href="https://asi.nic.in/" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://asi.nic.in/"}</a></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Ministry of Culture\xA0\u2014 Indian art, traditions and intangible heritage"}</span><br /><a href="https://www.indiaculture.gov.in/" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://www.indiaculture.gov.in/"}</a></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Kholo India & Sports Authority of India\xA0\u2014 Indigenous sports and traditional games"}</span><a href="https://kheloindia.gov.in/" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://kheloindia.gov.in/"}</a><br /></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"UNICEF & UNESCO\xA0\u2014 Child-safe and responsible AI guidance"}</span><a href="https://www.unicef.org/innocenti/reports/policy-guidance-ai-children" style={{
            textDecoration: "underline",
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"https://www.unicef.org/innocenti/reports/policy-guidance-ai-children"}</a><br /></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "27.79px",
        top: "413.45px",
        width: "507.69px",
        height: "227.37px",
        boxSizing: "border-box",
        backgroundColor: "#ebf1de",
        borderRadius: "37.9px"
      }} /><div key={11} style={{
        position: "absolute",
        left: "147.37px",
        top: "413.45px",
        width: "352px",
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
            color: "#4f6228"
          }}>{"MARKET RESEARCH"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "20.21px",
        top: "438.53px",
        width: "524.63px",
        height: "205.18px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Large Target Audience:"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0India has a vast school-going population, creating strong demand for engaging and curriculum-relevant digital learning tools."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Clear Market Gap:"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Most heritage platforms provide static text, images or videos; very few offer\xA0"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"story-driven exploration, cultural mini-games and multilingual interaction"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0together."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Growing Institutional Demand:"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0NEP 2020 encourages experiential learning, Indian Knowledge Systems, regional languages and technology-enabled education."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Scalable Adoption Opportunity:"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0BharatVerse can reach private and government schools through partnerships with\xA0"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"education departments, NGOs, museums and CSR programmes"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"."}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "686.07px",
        top: "413.45px",
        width: "507.69px",
        height: "227.37px",
        boxSizing: "border-box",
        backgroundColor: "#f3dcdb",
        borderRadius: "37.9px"
      }} /><div key={14} style={{
        position: "absolute",
        left: "776.89px",
        top: "413.45px",
        width: "507.69px",
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
            color: "#953735"
          }}>{"TECHNICAL DOCUMENTATION"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={15} style={{
        position: "absolute",
        left: "686.07px",
        top: "447.38px",
        width: "507.69px",
        height: "193.87px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"System Architecture:"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0React and TypeScript frontend with a custom HTML5 Canvas game engine and modular heritage-world structure."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Data Management:"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Structured JSON/TypeScript files store regions, NPCs and stories; LocalStorage automatically saves player progress."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"AI and Voice Module:"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Smriti Didi supports multilingual voice interaction with verified facts and child-safety filters."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-18px",
          paddingLeft: "18px",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Testing and Deployment:"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Type checking, gameplay-solvability validation and automated UI tests ensure a reliable browser-based release."}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={16} style={{
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
          }}>{"Beyonders"}</span></p></div></div></div>;
};
export default Slide6;
