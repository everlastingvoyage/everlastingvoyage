"use client";

import { FormEvent, useEffect, useState } from "react";

function InfinityMark({className=""}:{className?:string}) {
  return (
    <svg className={className} viewBox="0 0 460 250" aria-label="Everlasting Voyage infinity logo">
      <path d="M28 125 C66 52 130 38 178 66 C202 80 216 101 230 125 C244 149 258 170 282 184 C330 212 394 198 432 125 C394 52 330 38 282 66 C258 80 244 101 230 125 C216 149 202 170 178 184 C130 212 66 198 28 125"/>
    </svg>
  );
}

export default function Home() {
  const [entered,setEntered] = useState(false);
  const [message,setMessage] = useState("");

  useEffect(() => {
    document.body.classList.toggle("locked", !entered);
    return () => document.body.classList.remove("locked");
  }, [entered]);

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();
    if (!email) return;
    const list = JSON.parse(localStorage.getItem("ev-waitlist") || "[]") as string[];
    if (!list.includes(email)) list.push(email);
    localStorage.setItem("ev-waitlist", JSON.stringify(list));
    event.currentTarget.reset();
    setMessage("You’re on the early-access list.");
  }

  const timeline = [
    ["9:00 AM","Consumer Behaviour","Class · fixed commitment"],
    ["12:10 PM","Finance review · 40 minutes","Suggested focus window"],
    ["2:00 PM","Best Buy shift","Work · protected time"],
    ["7:30 PM","Light review · 20 minutes","Low-pressure task"],
    ["10:30 PM","Sleep protected","No tasks after this time"]
  ];

  const frequencies = [
    ["Alpha","10 Hz · Calm Focus"],
    ["Gamma","40 Hz · Deep Focus"],
    ["Theta","4 Hz · Creative Flow"],
    ["Delta","2 Hz · Deep Sleep"],
    ["888","Hz · Abundance"]
  ];

  return (
    <>
      <section className={`intro ${entered ? "exit" : ""}`}>
        <div className="introInner">
          <div className="symbolWrap">
            <InfinityMark className="introLogo"/>
            <span className="freq f1">Gamma · 40 Hz</span>
            <span className="freq f2">Delta · 2 Hz</span>
            <span className="freq f3">Alpha · 10 Hz</span>
            <span className="freq f4">Theta · 4 Hz</span>
          </div>
          <div className="brandTitle">
            <span>EVERLASTING</span>
            <strong>VOYAGE</strong>
          </div>
          <p className="tagline">Focus · Meditation · Brainwave Sync</p>
          <button className="enter" onClick={() => setEntered(true)}>Enter</button>
        </div>
      </section>

      <div className={`site ${entered ? "ready" : ""}`}>
        <header>
          <a href="#top" className="miniBrand">
            <InfinityMark className="miniLogo"/>
            <div><span>EVERLASTING</span><strong>VOYAGE</strong></div>
          </a>
          <nav><a href="#experience">Experience</a><a href="#frequencies">Frequencies</a><a href="#join">Early Access</a></nav>
          <a href="#join" className="navCta">Join Early Access</a>
        </header>

        <main id="top">
          <section className="hero">
            <InfinityMark className="heroLogo"/>
            <p className="kicker">Focus · Meditation · Brainwave Sync</p>
            <h1>EVERLASTING VOYAGE</h1>
            <p className="heroCopy">A calmer way to plan your week, adapt when life changes, and enter focused work without pressure.</p>
            <div className="actions"><a href="#experience" className="primary">Enter the experience</a><a href="#join" className="secondary">Join early access</a></div>
            <div className="wave"><svg viewBox="0 0 1200 180" preserveAspectRatio="none"><path d="M0,90 C100,15 200,165 300,90 C400,15 500,165 600,90 C700,15 800,165 900,90 C1000,15 1100,165 1200,90"/></svg></div>
          </section>

          <section className="story" id="experience">
            <div className="wrap">
              <p className="kicker">Productivity without pressure</p>
              <h2>One clear next step.</h2>
              <p className="copy">Everlasting Voyage turns classes, shifts and deadlines into a realistic plan that protects your time instead of filling every empty minute.</p>
              <div className="panel">
                {timeline.map(([time,title,sub]) => <div className="row" key={time+title}><span className="time">{time}</span><div className="event"><strong>{title}</strong><span>{sub}</span></div></div>)}
              </div>
            </div>
          </section>

          <section className="story" id="frequencies">
            <div className="wrap">
              <p className="kicker">Everlasting Voyage library</p>
              <h2>Choose how the session should feel.</h2>
              <p className="copy">Each atmosphere supports a different kind of session. The interface stays quiet; only the selected frequency comes alive.</p>
              <div className="frequencyGrid">
                {frequencies.map(([name,sub]) => <article className={name==="888" ? "frequencyCard gold" : "frequencyCard"} key={name}><strong>{name}</strong><span>{sub}</span></article>)}
              </div>
            </div>
          </section>

          <section className="join" id="join">
            <div className="wrap">
              <p className="kicker">Early access</p>
              <h2>ENTER THE VOYAGE</h2>
              <p className="copy centered">Join the first users testing Everlasting Voyage directly from phone, tablet and desktop.</p>
              <form onSubmit={join}><input name="email" type="email" placeholder="Your email address" required/><button className="primary">Join early access</button></form>
              <p className="message">{message}</p>
            </div>
          </section>
        </main>

        <footer><div className="wrap footerInner"><span>© 2026 Everlasting Voyage</span><span>Focus · Meditation · Brainwave Sync</span></div></footer>
      </div>
    </>
  );
}
