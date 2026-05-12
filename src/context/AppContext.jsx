import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribe, list, storeMode } from "../lib/store.js";
import { subscribeSlack } from "../lib/slack.js";

const AppContext = createContext(null);

const CURRENT_USER_ID = "u_you";

export function AppProvider({ children }) {
  const [users, setUsers] = useState(list("users"));
  const [highFives, setHighFives] = useState(list("highFives"));
  const [priorities, setPriorities] = useState(list("priorities"));
  const [okrs, setOkrs] = useState(list("okrs"));
  const [oneOnOnes, setOneOnOnes] = useState(list("oneOnOnes"));
  const [checkIns, setCheckIns] = useState(list("checkIns"));
  const [openMic, setOpenMic] = useState(list("openMic"));
  const [feedbackRequests, setFeedbackRequests] = useState(
    list("feedbackRequests")
  );
  const [slackFeed, setSlackFeed] = useState([]);

  useEffect(() => {
    const offs = [
      subscribe("users", setUsers),
      subscribe("highFives", setHighFives),
      subscribe("priorities", setPriorities),
      subscribe("okrs", setOkrs),
      subscribe("oneOnOnes", setOneOnOnes),
      subscribe("checkIns", setCheckIns),
      subscribe("openMic", setOpenMic),
      subscribe("feedbackRequests", setFeedbackRequests),
      subscribeSlack(setSlackFeed),
    ];
    return () => offs.forEach((off) => off && off());
  }, []);

  const currentUser =
    users.find((u) => u.id === CURRENT_USER_ID) || users[0] || null;

  const value = {
    storeMode,
    currentUser,
    users,
    highFives,
    priorities,
    okrs,
    oneOnOnes,
    checkIns,
    openMic,
    feedbackRequests,
    slackFeed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function userName(users, id) {
  return users.find((u) => u.id === id)?.name || "Unknown";
}

export function userAvatar(users, id) {
  return users.find((u) => u.id === id)?.avatar || "👤";
}
