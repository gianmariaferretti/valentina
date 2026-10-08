import type {
  Approach,
  StoryChoice,
  StoryDecision,
} from "../features/games/visual-novel/types";

export const relationshipChapters = [
  {
    time: "08:00",
    title: "MORNING",
    setting: "The kitchen, before diplomacy",
    artwork: "morning-kitchen",
    annotation: "Coffee first. International relations later.",
  },
  {
    time: "11:30",
    title: "WHERE ARE WE EATING?",
    setting: "An intersection with too many opinions",
    artwork: "lunch-street",
    annotation: "A reservation is a love language.",
  },
  {
    time: "14:00",
    title: "THE INCIDENT",
    setting: "A café with an excellent memory",
    artwork: "incident-cafe",
    annotation: "Exhibit A: absolutely not the point.",
  },
  {
    time: "17:30",
    title: "SHOPPING",
    setting: "The fitting-room waiting department",
    artwork: "shopping-window",
    annotation: "Time is a social construct. Apparently.",
  },
  {
    time: "20:00",
    title: "DINNER",
    setting: "A table for two and several unfinished thoughts",
    artwork: "dinner-table",
    annotation: "Please leave your ego at the door.",
  },
  {
    time: "23:00",
    title: "THE FINAL BOSS",
    setting: "Home. The small hours of the same team",
    artwork: "night-sofa",
    annotation: "There is no boss. There is a person.",
  },
] as const;

type ChoiceSeed = readonly [
  text: string,
  approach: Approach,
  consequence: string,
  flags?: readonly string[],
];
function decision(
  id: string,
  chapter: number,
  narration: string,
  dialogue: string,
  seeds: readonly ChoiceSeed[],
  extras: Partial<StoryDecision> = {},
): StoryDecision {
  return {
    id,
    chapter,
    speaker: "Valentina",
    narration,
    dialogue,
    choices: seeds.map(
      ([text, approach, consequence, flags], index): StoryChoice => ({
        id: `${id}:${index + 1}`,
        text,
        approach,
        consequence,
        flags,
      }),
    ),
    ...extras,
  };
}

/** Original fictional dialogue. Replace personal details here, never in the renderer. */
export const relationshipStory: readonly StoryDecision[] = [
  decision(
    "coffee",
    0,
    "The kettle clicks off. Gianmaria is already explaining how he would improve it.",
    "Can we have one morning without a product review?",
    [
      [
        "Put the coffee down and listen.",
        "care",
        "The kettle survives without a roadmap. She pulls out the chair beside her.",
      ],
      [
        "Offer a quiet coffee, no commentary.",
        "quiet",
        "For a few minutes, silence is something you share, not something to fix.",
      ],
      [
        "Prepare breakfast while she wakes up.",
        "practical",
        "A plate arrives before another opinion. This seems to help.",
      ],
      [
        "Explain that the kettle really does have a design flaw.",
        "ego",
        "Your argument is technically sound. Her expression is less enthusiastic.",
      ],
    ],
  ),
  decision(
    "note",
    0,
    "A folded shopping list sits under the sugar bowl. The bottom corner is blue.",
    "Don't throw that away. I still need it.",
    [
      [
        "Ask whether she wants to tell you about the blue corner.",
        "investigate",
        "She smiles: ‘Some things make sense later.’ You keep the list safe.",
        ["blue-note"],
      ],
      [
        "Leave it exactly where she put it.",
        "quiet",
        "You respect the small instruction. The blue corner remains a mystery.",
      ],
      [
        "Offer to do the shopping together.",
        "care",
        "The list becomes a plan for two, rather than another task.",
      ],
      [
        "Reorganise it by aisle without asking.",
        "ego",
        "Efficient. Unrequested. The distinction is noted.",
      ],
    ],
  ),
  decision(
    "morning-plan",
    0,
    "There is one free day ahead, and Gianmaria's calendar has developed ambitions.",
    "Are we spending today together or completing objectives?",
    [
      [
        "Promise dinner together, phones away.",
        "care",
        "‘Then keep that promise,’ she says, softer this time.",
        ["dinner-promise"],
      ],
      [
        "Let her choose the shape of the day.",
        "yield",
        "She takes the pen. Your calendar looks considerably more human.",
      ],
      [
        "Book lunch and leave the rest open.",
        "practical",
        "One anchor, no military itinerary. A workable compromise.",
      ],
      [
        "Pitch six locations and a spreadsheet.",
        "chaotic",
        "The day now has version numbers. She laughs despite herself.",
      ],
    ],
  ),
  decision(
    "phone",
    0,
    "A notification lands while she is telling a story. The phone glows like a tiny rival.",
    "You're doing that half-listening face.",
    [
      [
        "Turn it over and ask her to continue.",
        "care",
        "She restarts the sentence. This time you actually hear it.",
      ],
      [
        "Say you need two minutes, then put it away.",
        "practical",
        "A clear boundary beats a mysterious disappearance into a screen.",
      ],
      [
        "Hand her the phone and let her mute it.",
        "yield",
        "She exercises her new executive powers responsibly. Mostly.",
      ],
      [
        "Say ‘I'm listening’ while replying.",
        "neglect",
        "She stops talking. The notification wins a round nobody wanted to play.",
      ],
    ],
  ),
  decision(
    "late-start",
    0,
    "Shoes have gone missing. Breakfast plates are still on the table.",
    "We said we'd leave ten minutes ago.",
    [
      [
        "Help find the shoes; don't narrate the delay.",
        "practical",
        "The missing shoe turns out to be under your jacket.",
      ],
      [
        "Tell her the day can wait a little.",
        "quiet",
        "Neither of you has to sprint through your only free morning.",
      ],
      [
        "Apologise for leaving your things everywhere.",
        "care",
        "You take responsibility for an impressively small, real problem.",
      ],
      [
        "Announce a countdown in an airport voice.",
        "chaotic",
        "Boarding is delayed due to uncontrolled laughter and one annoyed look.",
      ],
    ],
  ),
  decision(
    "door",
    0,
    "At the door, she reaches for your hand. Your route app offers a shortcut.",
    "Scenic route or fastest route?",
    [
      [
        "Scenic. We have a whole day.",
        "quiet",
        "You walk at the speed of a conversation.",
      ],
      [
        "Whichever you want.",
        "yield",
        "She chooses the street with the bakery. Excellent governance.",
      ],
      [
        "Fastest, but stop for a snack.",
        "practical",
        "The shortcut comes with pastry insurance.",
      ],
      [
        "Choose the unmarked alley. An adventure.",
        "chaotic",
        "You emerge somewhere unexpected. Your confidence survives longer than the map.",
      ],
    ],
  ),
  decision(
    "lunch-choice",
    1,
    "Four menus. Two people. A hunger level nobody will formally acknowledge.",
    "I don't mind. You choose.",
    [
      [
        "Give her two real options and listen.",
        "care",
        "She picks the small place with the window seat.",
      ],
      [
        "Choose somewhere with fast service and chips.",
        "practical",
        "Preventive chips arrive before diplomatic tension.",
      ],
      [
        "Suggest her favourite of the four.",
        "yield",
        "She notices you remembered, and doesn't make a speech about it.",
      ],
      [
        "Go somewhere neither of you can pronounce.",
        "chaotic",
        "The menu becomes an expedition rather than a negotiation.",
      ],
    ],
  ),
  decision(
    "queue",
    1,
    "The chosen restaurant has a queue. Gianmaria has a theory about queue efficiency.",
    "Please don't become the queue consultant.",
    [
      [
        "Stand beside her and keep the theory private.",
        "quiet",
        "The queue progresses without your intervention.",
      ],
      [
        "Ask the host for a realistic wait.",
        "practical",
        "Twenty minutes. Enough information to make a decision together.",
      ],
      [
        "Suggest her second choice instead.",
        "yield",
        "A change of plan doesn't have to mean someone lost.",
      ],
      [
        "Deliver a short lecture about their system.",
        "ego",
        "Nobody asked. Several people now know.",
      ],
    ],
  ),
  decision(
    "receipt",
    1,
    "The host hands you a printed reservation slip. The back has a tiny star.",
    "Keep that. It might be useful later.",
    [
      [
        "Ask about the star and save the slip.",
        "investigate",
        "‘You're paying attention,’ she says. The blue corner suddenly feels relevant.",
        ["star-receipt"],
      ],
      [
        "Put it somewhere safe without asking.",
        "practical",
        "The document joins your growing collection of pocket paperwork.",
      ],
      [
        "Make a tiny paper crown out of it.",
        "chaotic",
        "The crown is funny. The host would still like the slip back.",
      ],
      [
        "Say you remember everything without paper.",
        "ego",
        "This bold claim is now part of the official record.",
      ],
    ],
  ),
  decision(
    "fries",
    1,
    "Her hand hovers over your chips. Earlier she said she wasn't hungry.",
    "Just one.",
    [
      [
        "Slide the plate between you.",
        "care",
        "‘One’ becomes several. It was always going to.",
      ],
      [
        "Order a second portion for the table.",
        "practical",
        "A supply problem is solved without a legal hearing.",
      ],
      [
        "Let her have the best ones.",
        "yield",
        "She leaves you one excellent chip. A benevolent administration.",
      ],
      [
        "Quote her earlier statement back to her.",
        "ego",
        "Your transcript is accurate. Lunch is not improved by transcripts.",
      ],
    ],
  ),
  decision(
    "wrong-order",
    1,
    "The waiter brings the wrong dish. Neither of you caused this.",
    "Could you help me sort this out?",
    [
      [
        "Ask kindly for the correct order.",
        "practical",
        "The kitchen fixes it. Nobody needs a villain.",
      ],
      [
        "Check what she wants before speaking for her.",
        "care",
        "She explains. You support, rather than take over.",
      ],
      [
        "Offer to swap plates if she prefers.",
        "yield",
        "She accepts the offer without needing you to insist.",
      ],
      [
        "Declare this the universe's tasting menu.",
        "chaotic",
        "An unexpected lunch becomes a story. She checks you really are okay with it.",
      ],
    ],
  ),
  decision(
    "lunch-bill",
    1,
    "The bill arrives with an extra drink on it. Gianmaria spots it instantly.",
    "Let's not turn three euros into a personality test.",
    [
      [
        "Politely check the extra drink, then move on.",
        "practical",
        "A factual correction, no victory lap.",
        ["bill-evidence"],
      ],
      [
        "Ask her how she wants to handle it.",
        "care",
        "You decide together. The waiter survives the afternoon.",
      ],
      [
        "Pay and leave before it becomes a speech.",
        "quiet",
        "You choose the rest of the day over a very small debate.",
      ],
      [
        "Prove the discrepancy with timestamps.",
        "ego",
        "The evidence is conclusive. The presentation is excessive.",
        ["bill-evidence"],
      ],
    ],
  ),
  decision(
    "spill",
    2,
    "A coffee lands on Gianmaria's sleeve. The café goes silent for half a second.",
    "Before you react: it was an accident.",
    [
      [
        "Check she's okay, then find napkins.",
        "care",
        "The sleeve is wet. The relationship doesn't have to be.",
      ],
      [
        "Get water and clean up the table.",
        "practical",
        "The incident becomes a laundry problem.",
      ],
      [
        "Call the stain an exclusive café edition.",
        "chaotic",
        "She laughs, then checks whether you actually mean it.",
      ],
      [
        "Explain the correct way to pass a cup.",
        "ego",
        "Your sleeve is still wet. Now the room is cold as well.",
      ],
    ],
  ),
  decision(
    "fine",
    2,
    "You leave the café. Her answer is short enough to hide several possible meanings.",
    "I'm fine.",
    [
      [
        "Okay. I'll be here if you want to talk.",
        "quiet",
        "You leave a door open without standing in it.",
      ],
      ["What's wrong?", "care", "You ask once and make room for an answer."],
      [
        "Are you sure? Are you really sure?",
        "ego",
        "A question repeated can start to sound like an interrogation.",
      ],
      [
        "I know you're not fine. Tell me.",
        "care",
        "The words could be care or pressure. The morning you shared decides which.",
      ],
    ],
    {
      alternate: {
        when: [{ metric: "trust", minimum: 70 }],
        narration:
          "She is quieter than usual, but she hasn't let go of your hand. The morning's attention has earned some trust.",
        dialogue: "I'm fine. Just... give me a second.",
      },
    },
  ),
  decision(
    "blue-detour",
    2,
    "She glances at the blue corner of the shopping list, then at a closed bookshop.",
    "Do you remember what I said this morning?",
    [
      [
        "Show her the list you kept safe.",
        "investigate",
        "She draws another tiny star. ‘Not yet. Keep noticing.’",
        ["second-star"],
      ],
      [
        "Ask gently for a reminder.",
        "care",
        "She tells you enough to carry the conversation forward.",
      ],
      [
        "Give her time instead of guessing.",
        "quiet",
        "A pause is not the same as indifference.",
      ],
      [
        "Claim you knew the plan all along.",
        "ego",
        "She asks you to describe it. Your plan develops a suspicious fog.",
      ],
    ],
    { requires: [{ flag: "blue-note" }, { flag: "star-receipt" }] },
  ),
  decision(
    "explanation",
    2,
    "She explains that the café comment felt dismissive. You remember it differently.",
    "I don't need you to win this. I need you to hear me.",
    [
      [
        "Repeat what you heard, without defending yourself.",
        "care",
        "The argument becomes something you can both understand.",
      ],
      [
        "Say you'll sit with it before replying.",
        "quiet",
        "You resist an instant rebuttal. She notices the effort.",
      ],
      [
        "Admit the impact matters even if you meant well.",
        "yield",
        "You don't need the same memory to respect how it felt.",
      ],
      [
        "Present your exact wording as evidence.",
        "ego",
        "The quotation is correct. The conversation is about something else.",
      ],
    ],
  ),
  decision(
    "repair",
    2,
    "A little space opens between the argument and the rest of the afternoon.",
    "What do we do now?",
    [
      [
        "Apologise for your part, without a ‘but’.",
        "care",
        "An apology finally gets to be an apology.",
      ],
      [
        "Let her decide what would help.",
        "yield",
        "She asks for a walk and no more courtroom voices.",
      ],
      [
        "Offer a quiet walk, with no forced conversation.",
        "quiet",
        "You fall into step again, slowly.",
      ],
      [
        "Buy emergency ice cream and admit it isn't an apology.",
        "practical",
        "The apology still happens. Ice cream merely improves the venue.",
      ],
    ],
  ),
  decision(
    "promise-check",
    2,
    "A friend texts about a quick meeting later. It clashes with your earlier plan.",
    "I thought tonight was ours.",
    [
      [
        "Keep the evening free, and tell your friend clearly.",
        "care",
        "A promise survives its first inconvenient test.",
        ["promise-kept"],
      ],
      [
        "Ask whether a short stop would work for both of you.",
        "practical",
        "You negotiate before changing a shared plan.",
        ["promise-kept"],
      ],
      [
        "Choose her evening without making her feel indebted.",
        "yield",
        "She doesn't have to argue for something already promised.",
        ["promise-kept"],
      ],
      [
        "Go anyway; it will probably be fine.",
        "neglect",
        "Probably is not a conversation. She stops planning around you.",
        ["broken-evening"],
      ],
    ],
  ),
  decision(
    "route-dispute",
    2,
    "The street sign confirms your shortcut was longer. Gianmaria has another argument prepared.",
    "Can we just agree the map won?",
    [
      [
        "Laugh and follow the actual sign.",
        "chaotic",
        "The map receives a ceremonial promotion.",
      ],
      [
        "Accept her route.",
        "yield",
        "You stop competing with street furniture.",
      ],
      [
        "Check the sign once, then choose together.",
        "practical",
        "A small piece of evidence stays small.",
        ["route-evidence"],
      ],
      [
        "Document that you warned her about the shortcut.",
        "ego",
        "You have a receipt. She has a very long look.",
        ["route-evidence"],
      ],
    ],
  ),
  decision(
    "shop-entry",
    3,
    "The first shop contains approximately a thousand things she wants to show you.",
    "Will you actually look, or wait by the door?",
    [
      [
        "Look with her, and ask what caught her eye.",
        "care",
        "Shopping becomes time together instead of time served.",
      ],
      [
        "Find a comfortable place and stay available.",
        "quiet",
        "You set an honest boundary without disappearing.",
      ],
      [
        "Carry the bags and check the dinner booking.",
        "practical",
        "The invisible jobs are covered.",
      ],
      [
        "Try on the most ridiculous jacket you can find.",
        "chaotic",
        "The mirror witnesses a deeply unserious fashion debut.",
      ],
    ],
  ),
  decision(
    "dress",
    3,
    "She steps out of the fitting room, then hesitates at the mirror.",
    "What do you think? Honestly.",
    [
      [
        "Tell her specifically what you like, then ask how she feels.",
        "care",
        "An actual observation beats an automatic compliment.",
      ],
      [
        "Let her take a moment without filling the silence.",
        "quiet",
        "She sees herself before hearing another opinion.",
      ],
      [
        "Say her comfort matters more than your vote.",
        "yield",
        "She relaxes. This isn't an audition.",
      ],
      [
        "Give it a numerical rating.",
        "ego",
        "The fitting room did not request a scoring system.",
      ],
    ],
  ),
  decision(
    "window-star",
    3,
    "The bookshop window has a blue envelope tucked beside a star-shaped bookmark.",
    "Funny coincidence, isn't it?",
    [
      [
        "Connect the list, the slip and this window.",
        "investigate",
        "Her smile says you're getting closer. You remember the blue envelope.",
        ["window-clue"],
      ],
      [
        "Ask whether she wants the bookmark.",
        "care",
        "She says not yet. You let the mystery breathe.",
      ],
      [
        "Take a quiet moment beside her.",
        "quiet",
        "The city carries on. Neither of you has to.",
      ],
      [
        "Announce that you have solved absolutely everything.",
        "ego",
        "‘Then you won't need any more clues,’ she replies.",
      ],
    ],
    { requires: [{ flag: "second-star" }] },
  ),
  decision(
    "bag",
    3,
    "She puts a shopping bag beside you while she checks a size.",
    "Please don't leave this behind.",
    [
      [
        "Keep it in your hand until she returns.",
        "practical",
        "One small request is quietly fulfilled.",
        ["bag-safe"],
      ],
      [
        "Put it beside your own things and stay with it.",
        "quiet",
        "No grand gesture. Just being reliable.",
        ["bag-safe"],
      ],
      [
        "Carry everything while she finishes.",
        "yield",
        "You become the mobile bag department.",
        ["bag-safe"],
      ],
      [
        "Leave it while you browse another floor.",
        "neglect",
        "The bag goes missing. ‘I asked one thing,’ she says.",
        ["broken-bag"],
      ],
    ],
  ),
  decision(
    "budget",
    3,
    "A price tag has more confidence than either of you expected.",
    "I love it. But that's a lot.",
    [
      [
        "Ask what she likes about it, without judging.",
        "care",
        "She can want something without defending her character.",
      ],
      [
        "Help compare it with a less expensive option.",
        "practical",
        "The decision gains information, not pressure.",
      ],
      [
        "Say it's her choice and mean it.",
        "yield",
        "You resist appointing yourself finance minister.",
      ],
      [
        "Calculate cost-per-wear out loud for five minutes.",
        "ego",
        "The arithmetic is impeccable. The timing is not.",
      ],
    ],
  ),
  decision(
    "shopping-time",
    3,
    "Dinner is approaching. One last shop glows enticingly across the street.",
    "Five minutes?",
    [
      [
        "Call the restaurant and ask for a little flexibility.",
        "practical",
        "A practical adjustment prevents a manufactured emergency.",
      ],
      [
        "Agree, but decide the leaving time together.",
        "care",
        "A boundary feels different when both people helped choose it.",
      ],
      [
        "Let her choose, without keeping a resentment ledger.",
        "yield",
        "Five minutes stretches. You choose not to become a stopwatch.",
      ],
      [
        "Make it a five-minute treasure hunt.",
        "chaotic",
        "You both return with something tiny and inexplicable.",
      ],
    ],
  ),
  decision(
    "shop-exit",
    3,
    "Outside, the air is cooler. She looks tired rather than angry now.",
    "Can we slow down a bit?",
    [
      [
        "Sit with her on a bench.",
        "quiet",
        "The day stops asking you to do more.",
      ],
      [
        "Offer water and a snack.",
        "practical",
        "The emergency provisions finally justify their pocket space.",
      ],
      [
        "Ask whether she'd rather go home after dinner.",
        "care",
        "The evening remains a shared decision.",
      ],
      [
        "Say she can choose every remaining stop.",
        "yield",
        "The itinerary changes hands again, without a struggle.",
      ],
    ],
  ),
  decision(
    "dinner-arrival",
    4,
    "The table is small. The candle makes even the menu look significant.",
    "Phones away?",
    [
      [
        "Put yours away and keep the morning promise.",
        "care",
        "You make the ordinary part of the promise visible.",
        ["phone-away"],
      ],
      [
        "Switch on do-not-disturb for both of you.",
        "practical",
        "The table is protected from everyone's updates.",
        ["phone-away"],
      ],
      [
        "Hand it to her for safekeeping.",
        "yield",
        "She pockets it with a suspiciously official nod.",
        ["phone-away"],
      ],
      [
        "Check one last message through the starter.",
        "neglect",
        "One last message develops several sequels.",
        ["broken-dinner"],
      ],
    ],
  ),
  decision(
    "dinner-menu",
    4,
    "One menu item sounds extraordinary. Another sounds safe.",
    "Shall we share something?",
    [
      [
        "Choose two dishes together.",
        "care",
        "Nobody has to guess what the other secretly wanted.",
      ],
      [
        "Let her choose and enjoy the surprise.",
        "yield",
        "You relinquish menu control without a ceremony.",
      ],
      [
        "Order a dependable dish and something new.",
        "practical",
        "Dinner gets both a safety net and a plot twist.",
      ],
      [
        "Pick the strangest thing on the menu.",
        "chaotic",
        "The waiter pauses. This is promising, or concerning.",
      ],
    ],
  ),
  decision(
    "dinner-story",
    4,
    "She returns to the story interrupted by your phone this morning.",
    "Remember what I was telling you?",
    [
      [
        "Ask her to finish and stay with the details.",
        "care",
        "The interrupted thread finds its way back to you.",
      ],
      [
        "Listen without preparing a solution.",
        "quiet",
        "She wasn't asking to be repaired.",
      ],
      [
        "Ask what kind of support she'd like.",
        "practical",
        "Advice waits for an invitation.",
      ],
      [
        "Explain what you would have done in her situation.",
        "ego",
        "Her story becomes your demonstration. She notices.",
      ],
    ],
  ),
  decision(
    "blue-hour",
    4,
    "The candlelight makes the tiny stars on the saved paper visible again.",
    "You kept all of them?",
    [
      [
        "Lay the clues together and ask what comes next.",
        "investigate",
        "‘At home. When it's quiet.’ The last piece is a time, not a place.",
        ["blue-hour"],
      ],
      [
        "Tell her the little things matter to you.",
        "care",
        "She touches your hand instead of explaining.",
      ],
      [
        "Keep the papers safe for later.",
        "quiet",
        "Some stories benefit from not being rushed.",
      ],
      [
        "Demand to know the answer now.",
        "ego",
        "A surprise is not a password recovery flow.",
      ],
    ],
    { requires: [{ flag: "window-clue" }, { metric: "trust", minimum: 65 }] },
  ),
  decision(
    "wrong-dessert",
    4,
    "The dessert is not the one you ordered. The receipt agrees with Gianmaria.",
    "Please don't make this a championship.",
    [
      [
        "Check the receipt calmly, then share whichever arrives.",
        "practical",
        "The receipt helps. It does not need a podium.",
        ["dessert-evidence"],
      ],
      [
        "Ask whether she'd like to swap it.",
        "care",
        "Her preference takes priority over the thrill of being correct.",
      ],
      [
        "Let her choose the ending of the dessert saga.",
        "yield",
        "She chooses an extra spoon.",
      ],
      [
        "Politely establish that you were, in fact, correct.",
        "ego",
        "You win the factual dispute. The jury refuses to clap.",
        ["dessert-evidence"],
      ],
    ],
  ),
  decision(
    "dinner-memory",
    4,
    "The waiter offers to take a photograph. Your sleeve still carries the café incident.",
    "Photo or just keep this one for us?",
    [
      [
        "Ask what she prefers.",
        "yield",
        "She chooses. You don't turn the choice into a referendum.",
      ],
      [
        "Keep the moment without a screen.",
        "quiet",
        "A memory can exist without documentation.",
      ],
      [
        "Take one photo, then return to the table.",
        "care",
        "One frame, not a production schedule.",
      ],
      [
        "Pose dramatically with the stained sleeve.",
        "chaotic",
        "The incident earns a deeply unearned glamour shot.",
      ],
    ],
  ),
  decision(
    "walk-home",
    4,
    "You step into the evening. The original plan is long gone.",
    "It wasn't exactly the day we planned.",
    [
      [
        "Say you're glad you spent it together.",
        "care",
        "The imperfect day doesn't need to be defended.",
      ],
      [
        "Walk slowly and hold her hand.",
        "quiet",
        "The answer is a pace rather than a speech.",
      ],
      [
        "Offer a detour for late-night chips.",
        "practical",
        "The snack department refuses to close.",
      ],
      [
        "Invent an award for the day's worst decision.",
        "chaotic",
        "Nominations are numerous. The walk gets funnier.",
      ],
    ],
  ),
  decision(
    "night-room",
    5,
    "At home, the sofa looks comfortable. A blanket has room for two.",
    "I'm tired. Can we not do anything complicated?",
    [
      [
        "Make the room quiet and sit beside her.",
        "quiet",
        "No performance. Just company.",
      ],
      [
        "Bring water, a blanket and a charger.",
        "practical",
        "You arrange the small things, then stop arranging.",
      ],
      [
        "Ask what she needs and listen.",
        "care",
        "She says ‘this’. You don't improve upon it.",
      ],
      [
        "Pitch a surprise activity with three stages.",
        "chaotic",
        "The presentation receives an affectionate, exhausted veto.",
      ],
    ],
  ),
  decision(
    "film",
    5,
    "The streaming menu scrolls past for the third time.",
    "Can I choose the film tonight?",
    [
      [
        "Yes, and no commentary during the opening.",
        "yield",
        "She selects something you've never seen. You give it a chance.",
      ],
      [
        "Offer a shortlist, with her final choice.",
        "practical",
        "The interface loses its bid to become the evening.",
      ],
      [
        "Ask whether she'd prefer talking instead.",
        "care",
        "The screen waits. You don't assume silence means a film.",
      ],
      [
        "Explain why your selection is objectively superior.",
        "ego",
        "Objectively is doing an extraordinary amount of work here.",
      ],
    ],
  ),
  decision(
    "last-argument",
    5,
    "A detail from the café returns. It still feels slightly unfinished.",
    "Do you understand why I was upset?",
    [
      [
        "Tell her what you've understood since then.",
        "care",
        "What happened earlier changes what you can honestly say now.",
      ],
      [
        "Admit you're still learning, and stay present.",
        "quiet",
        "Not knowing everything doesn't stop you being kind.",
      ],
      [
        "Accept her feelings without asking for a verdict.",
        "yield",
        "The imaginary courtroom closes for the night.",
      ],
      [
        "Produce the day's three pieces of factual evidence.",
        "ego",
        "The files are in order. The feelings do not fit into a folder.",
      ],
    ],
  ),
  decision(
    "night-promise",
    5,
    "She folds the blanket around both of you. The day finally slows down.",
    "Tomorrow, can we start on the same team?",
    [
      [
        "Promise to listen, and name one thing you'll change.",
        "care",
        "A small, specific promise is easier to trust than a grand one.",
        ["same-team"],
      ],
      [
        "Agree and let the quiet settle.",
        "quiet",
        "No closing statement is necessary.",
        ["same-team"],
      ],
      [
        "Let her set tomorrow's first plan.",
        "yield",
        "She chooses coffee and no kettle reviews.",
        ["same-team"],
      ],
      [
        "Say you were on the right team all along.",
        "ego",
        "She was asking for a beginning, not a defence of the past.",
      ],
    ],
  ),
  decision(
    "final-fine",
    5,
    "One final silence. She rests her head against the sofa.",
    "I'm fine.",
    [
      [
        "Okay. I'm here, no interrogation.",
        "quiet",
        "You offer presence instead of certainty.",
      ],
      [
        "Ask once whether she wants to talk.",
        "care",
        "You wait for a real answer, not the answer you prefer.",
      ],
      [
        "Ask again until you get an explanation.",
        "ego",
        "Persistence and care are not always the same thing.",
      ],
      [
        "Say you know she's not fine and invite her to tell you.",
        "care",
        "How this lands depends on the trust and space you built all day.",
      ],
    ],
  ),
  decision(
    "lights",
    5,
    "The city outside is quiet. The last task is simply to end the day together.",
    "Come to bed?",
    [
      [
        "Yes. Leave the day without a final scorecard.",
        "quiet",
        "The day closes softly, carrying every earlier choice with it.",
      ],
      [
        "Say one specific thing you're grateful for.",
        "care",
        "You don't rewrite the difficult parts. You remember the good ones too.",
      ],
      [
        "Check the doors and bring the blanket.",
        "practical",
        "The last small jobs are done. Now you can rest.",
      ],
      [
        "Propose tomorrow's completely unreasonable adventure.",
        "chaotic",
        "She laughs once more. Then confiscates the itinerary.",
      ],
    ],
  ),
];

// Optional responses are authored separately from ordinary choices, with explicit prerequisites.
export const hiddenRelationshipChoices: Readonly<Record<string, StoryChoice>> =
  {
    fine: {
      id: "fine:5",
      text: "Remember the blue list. Ask about the day she hoped for.",
      approach: "investigate",
      consequence:
        "You connect her silence to something she actually told you, rather than guessing. She starts talking.",
      flags: ["heard-clue"],
      requires: [{ flag: "blue-note" }, { metric: "trust", minimum: 65 }],
    },
    "final-fine": {
      id: "final-fine:5",
      text: "It's quiet now. Ask about the little blue envelope.",
      approach: "investigate",
      consequence:
        "She reaches behind a book and places the envelope between you. ‘I hoped you'd notice.’",
      flags: ["envelope-open"],
      requires: [
        { flag: "blue-hour" },
        { flag: "heard-clue" },
        { flag: "same-team" },
        { metric: "trust", minimum: 75 },
        { metric: "valentinaPatience", minimum: 40 },
      ],
    },
  };
