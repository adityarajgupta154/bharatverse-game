import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_2.png";
import img_2 from "./assets/images/image_6.png";
const Slide5: React.FC = () => {
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
  return <div id="slide-5" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-5" style={{
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
          }}>{"IMPACT AND BENEFITS"}</span></p></div><div key={2} style={{
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
          }}>{"@SIH Idea submission- Template"}</span></p></div><img key={3} src={img_1} alt="Picture 10" style={{
        position: "absolute",
        left: "1026.78px",
        top: "0.16px",
        width: "236.2px",
        height: "111.53px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><svg key={4} style={{
        position: "absolute",
        left: "730.33px",
        top: "115px",
        width: "1px",
        height: "548.41px",
        overflow: "visible"
      }}><line x1="0" y1="0" x2="0" y2="548.41" stroke="#000000" strokeWidth="4" /></svg><div key={5} style={{
        position: "absolute",
        left: "750.99px",
        top: "115px",
        width: "512px",
        height: "87.24px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"                  FUTURE PROSPECTS"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0"}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "730.33px",
        top: "172.56px",
        width: "549.67px",
        height: "580.01px",
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
          }}>{"Expand Across India:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Add more states, monuments, folk traditions, festivals, freedom movements and indigenous games as playable heritage worlds."}</span></p><p style={{
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
          }}>{"Government-School Integration:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0With government support, BharatVerse can be aligned with the school curriculum and introduced as a\xA0"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"recommended or structured heritage-learning activity"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0in government schools."}</span></p><p style={{
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
          }}>{"Partnerships with NGOs:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Collaborate with education and cultural NGOs to provide heritage learning in rural, tribal and underserved communities."}</span></p><p style={{
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
          }}>{"Multilingual Learning:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Introduce regional languages, voice narration and locally relevant stories so children can experience heritage in their mother tongue."}</span></p><p style={{
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
          }}>{"Teacher and Classroom Tools:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Develop lesson plans, classroom activities, teacher dashboards and progress reports for effective school adoption."}</span></p><p style={{
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
          }}>{"AR and Virtual Heritage Tours:"}</span><span style={{
            fontSize: "calc(14pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Enable students to experience monuments, historical environments and cultural practices through immersive AR-based learning."}</span></p><p style={{
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
            fontWeight: "700"
          }}>{"Community-Contributed Heritage:"}</span><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))"
          }}>{"\xA0Allow historians, teachers, museums and local communities to contribute verified regional stories and cultural knowledge."}</span></p><p style={{
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
          fontSize: "calc(11pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p><p style={{
          lineHeight: "1.2",
          textIndent: "-30px",
          paddingLeft: "30px",
          fontSize: "calc(14pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            marginRight: "8px"
          }}>{"\u2022"}</span></p></div><div key={7} style={{
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
          }}>{"Beyonders"}</span></p></div><img key={8} src={img_2} alt="Picture 17" style={{
        position: "absolute",
        left: "0px",
        top: "116.88px",
        width: "691.77px",
        height: "548.41px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={9} style={{
        position: "absolute",
        left: "291.47px",
        top: "130.02px",
        width: "124.41px",
        height: "48.47px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(24pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"IMPACT"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "99.3px",
        top: "234.71px",
        width: "231.92px",
        height: "60.59px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))"
          }}>{"Brings regional stories, traditions and"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))"
          }}>{"indigenous games to life for the next"}</span></p><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))"
          }}>{"generation."}</span></p></div><div key={11} style={{
        position: "absolute",
        left: "97.34px",
        top: "203.82px",
        width: "231.92px",
        height: "35.54px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Cultural Impact"}</span></p></div><div key={12} style={{
        position: "absolute",
        left: "435.19px",
        top: "206.67px",
        width: "231.92px",
        height: "35.54px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Educational Impact"}</span></p></div><div key={13} style={{
        position: "absolute",
        left: "435.19px",
        top: "237.79px",
        width: "231.92px",
        height: "58.16px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Transforms passive memorisation into"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"activity-based learning through stories"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"and challenges."}</span></p></div><div key={14} style={{
        position: "absolute",
        left: "99.3px",
        top: "334.85px",
        width: "229.96px",
        height: "35.54px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Accessibility Impact"}</span></p></div><div key={15} style={{
        position: "absolute",
        left: "99.3px",
        top: "367.25px",
        width: "229.96px",
        height: "58.16px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Browser-based, no-install learning"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"designed for school computers, tablets"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"and low-bandwidth access."}</span></p></div><div key={16} style={{
        position: "absolute",
        left: "435.19px",
        top: "336.73px",
        width: "231.92px",
        height: "35.54px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"Safe Digital Impact"}</span></p></div><div key={17} style={{
        position: "absolute",
        left: "435.19px",
        top: "367.25px",
        width: "231.92px",
        height: "58.16px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"Provides child-focused guidance using"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"reviewed facts, privacy protection and"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"multi-layer safety filters."}</span></p></div><div key={18} style={{
        position: "absolute",
        left: "182.78px",
        top: "457.81px",
        width: "170.89px",
        height: "35.54px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(16pt * var(--pptx-font-scale, 1))",
            fontWeight: "700"
          }}>{"National Impact"}</span></p></div><div key={19} style={{
        position: "absolute",
        left: "182.78px",
        top: "488.39px",
        width: "416.85px",
        height: "42.01px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(10pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"A reusable platform where new regions and cultural experiences can be"}</span><br /><span style={{
            fontSize: "calc(10pt * var(--pptx-font-scale, 1))"
          }}>{"added\u2014building a scalable digital heritage learning network for India."}</span></p></div><div key={20} style={{
        position: "absolute",
        left: "179.03px",
        top: "583.53px",
        width: "147.49px",
        height: "29.08px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#ffffff"
          }}>{"DISCOVER"}</span></p></div><div key={21} style={{
        position: "absolute",
        left: "345.8px",
        top: "583.53px",
        width: "59.75px",
        height: "29.08px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#ffffff"
          }}>{"PLAY"}</span></p></div><div key={22} style={{
        position: "absolute",
        left: "477.91px",
        top: "584.64px",
        width: "90.93px",
        height: "29.08px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "4.8px 9.6px 4.8px 9.6px",
        wordWrap: "break-word"
      }}><p style={{
          lineHeight: "1.2",
          fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(12pt * var(--pptx-font-scale, 1))",
            fontWeight: "700",
            color: "#ffffff"
          }}>{"RESTORE"}</span></p></div></div></div>;
};
export default Slide5;
