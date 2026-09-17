import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_2.png";
import img_2 from "./assets/images/image_3.png";
const Slide2: React.FC = () => {
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
  return <div id="slide-2" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-2" style={{
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
        left: "0px",
        top: "667.17px",
        width: "1280px",
        height: "52.83px",
        boxSizing: "border-box",
        backgroundColor: "#0070C0",
        boxShadow: "0px 2.41px 0px rgba(128, 128, 128, 0.35)"
      }} /><div key={1} style={{
        position: "absolute",
        left: "19.21px",
        top: "0px",
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
        }}><br /><span style={{
            fontSize: "calc(36pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Times New Roman', Times, serif",
            fontWeight: "700",
            color: "#000000"
          }}>{"BharatVerse"}</span></p></div><div key={2} style={{
        position: "absolute",
        left: "488px",
        top: "667.33px",
        width: "336.38px",
        height: "38.33px",
        boxSizing: "border-box",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Calibri', 'Helvetica Neue', Arial, sans-serif",
            color: "#ffffff"
          }}>{"@SIH Idea submission- Template"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "33.94px",
        top: "19.14px",
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
          }}>{"Beyonders"}</span></p></div><img key={4} src={img_1} alt="Picture 10" style={{
        position: "absolute",
        left: "1026.78px",
        top: "0.16px",
        width: "236.2px",
        height: "111.53px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={5} style={{
        position: "absolute",
        left: "477.12px",
        top: "280.32px",
        width: "19.39px",
        height: "38.78px",
        boxSizing: "border-box",
        backgroundColor: "transparent"
      }} /><div key={6} style={{
        position: "absolute",
        left: "26.88px",
        top: "138.17px",
        width: "333.12px",
        height: "439.16px",
        boxSizing: "border-box",
        backgroundColor: "#4f81bd"
      }} /><div key={7} style={{
        position: "absolute",
        left: "29.08px",
        top: "209.03px",
        width: "344.64px",
        height: "61.39px",
        boxSizing: "border-box",
        backgroundColor: "transparent"
      }}><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "644.16px",
        top: "207.36px",
        width: "19.39px",
        height: "38.78px",
        boxSizing: "border-box",
        backgroundColor: "transparent"
      }} /><div key={9} style={{
        position: "absolute",
        left: "108.79px",
        top: "147.92px",
        width: "639.84px",
        height: "54.93px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            textDecoration: "underline",
            fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#002060"
          }}>{"PROBLEM"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "29.08px",
        top: "197.77px",
        width: "330.92px",
        height: "100.17px",
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
          }}>{"Heritage is taught passively"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 textbooks and rote memorisation give children no way to experience history."}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "26.88px",
        top: "301.8px",
        width: "333.12px",
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
          }}>{"History feels distant"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 ancient cities, crafts and traditions seem disconnected from a child's daily life."}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "24.68px",
        top: "378.09px",
        width: "322.84px",
        height: "129.25px",
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
          }}>{"Traditional games, crafts and festivals are fading"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 children rarely engage with living heritage like kho-kho, rangoli or diyas."}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(18pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(18pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "26.88px",
        top: "477.16px",
        width: "315.16px",
        height: "100.17px",
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
          }}>{"Digital content is static and one-way"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 no exploration, no progress, no motivation to return and learn deeper."}</span></p></div><img key={14} src={img_2} alt="Preview" style={{
        position: "absolute",
        left: "208.12px",
        top: "581.19px",
        width: "825.38px",
        height: "80.89px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={15} style={{
        position: "absolute",
        left: "421.75px",
        top: "140.42px",
        width: "333.12px",
        height: "439.16px",
        boxSizing: "border-box",
        background: "linear-gradient(90deg, #ffffff 0%, #d9ff8a 100%)"
      }} /><div key={16} style={{
        position: "absolute",
        left: "463.2px",
        top: "157.67px",
        width: "361.92px",
        height: "54.93px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            textDecoration: "underline",
            fontSize: "calc(28pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#4f6228"
          }}>{"OUR SOLUTION"}</span></p></div><div key={17} style={{
        position: "absolute",
        left: "421.75px",
        top: "209.84px",
        width: "326.88px",
        height: "145.41px",
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
          }}>{"BharatVerse"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 a browser 2D game that turns India's heritage into a\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"playable map of 5 worlds"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2014 Indus Valley, Magadha, folk arts, traditions & sports."}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "428.71px",
        top: "327.94px",
        width: "326.88px",
        height: "149.21px",
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
          }}>{"Learn by doing"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 children fix Indus drains, build an ancient city, make Rangoli, light diyas & race Kho-Kho \u2014\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"6 working mini-games"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{", zero rote learning."}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={19} style={{
        position: "absolute",
        left: "425.59px",
        top: "442.72px",
        width: "333.12px",
        height: "100.17px",
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
          }}>{"Memory Restoration"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0\u2192 every game restores the map's lost memories \u2014\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"visible progress"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0that pulls children back to learn more."}</span></p></div><div key={20} style={{
        position: "absolute",
        left: "844.51px",
        top: "140.42px",
        width: "410.8px",
        height: "248.19px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff"
      }} /><div key={21} style={{
        position: "absolute",
        left: "968.64px",
        top: "136.61px",
        width: "427.2px",
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
            fontWeight: "700"
          }}>{"WHY DIFFERENT?"}</span></p></div><div key={22} style={{
        position: "absolute",
        left: "842.32px",
        top: "171.92px",
        width: "410.8px",
        height: "126.02px",
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
          }}>{"Others digitise heritage \u2014 we make it playable."}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Every app shows monuments and facts; BharatVerse is the only one where a child\xA0"}</span><span style={{
            fontStyle: "italic",
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"fixes"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0the Indus drains,\xA0"}</span><span style={{
            fontStyle: "italic",
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"builds"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0the ancient city and\xA0"}</span><span style={{
            fontStyle: "italic",
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"plays"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Kho-Kho \u2014\xA0"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"you can't forget what you've done yourself."}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={23} style={{
        position: "absolute",
        left: "843.37px",
        top: "281.98px",
        width: "400.76px",
        height: "106.63px",
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
          }}>{"The first AI guide a parent can trust."}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Smriti Didi speaks to children in their own language \u2014 but she is engineered to say\xA0"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"only pre-verified heritage facts"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{", with safety filters at every step.\xA0"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"AI for children, with zero risk of AI mistakes."}</span></p></div><div key={24} style={{
        position: "absolute",
        left: "844.51px",
        top: "405.12px",
        width: "418.47px",
        height: "167.76px",
        boxSizing: "border-box",
        backgroundColor: "#ffffff"
      }} /><div key={25} style={{
        position: "absolute",
        left: "853.91px",
        top: "436.38px",
        width: "387.62px",
        height: "45.24px",
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
          }}>{"Children don't study heritage \u2014 they play it."}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Every lesson is a game they\xA0"}</span><span style={{
            fontStyle: "italic",
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{"do"}</span><span style={{
            fontSize: "calc(11pt * var(--pptx-font-scale, 1))"
          }}>{", so it stays with them for life."}</span></p></div><div key={26} style={{
        position: "absolute",
        left: "917.33px",
        top: "404.54px",
        width: "312px",
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
            fontWeight: "700"
          }}>{"KEY VALUE PROPOSITION"}</span></p></div><div key={27} style={{
        position: "absolute",
        left: "855.93px",
        top: "478.31px",
        width: "375.65px",
        height: "87.24px",
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
          }}>{"A safe AI friend in their own language."}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Smriti Didi speaks Hinglish and says only verified facts \u2014 learning feels like talking to an elder sister, not reading a textbook."}</span></p></div></div></div>;
};
export default Slide2;
