export interface TreatyArticle {
  readonly number: number;
  readonly title: string;
  readonly clauses: readonly string[];
}

export interface TreatyTitle {
  readonly numeral: string;
  readonly title: string;
  readonly articles: readonly TreatyArticle[];
}

export const agreementNumber = "VG-2026-001";
export const treatyVersion = "1.0.0";
export const treatySubtitle =
  "Treaty of Love, Patience & International Cooperation";
export const treatyPreamble = [
  "The Parties,",
  "RECALLING that their first encounter at the Black Lion in London marked the beginning of a relationship neither Party could reasonably have anticipated;",
  "RECOGNISING that 31 October 2025 represents the commencement of their romantic partnership;",
  "ACKNOWLEDGING that their Italian and Colombian backgrounds contribute to a unique bilateral relationship characterised by affection, cultural exchange, occasional misunderstandings and considerable stubbornness;",
  "AFFIRMING that love, trust, loyalty, respect, personal freedom and mutual understanding constitute the fundamental principles of this Agreement;",
  "CONVINCED that, although love cannot be governed by legal provisions, attempting to regulate it through a forty-article international treaty is an entirely reasonable romantic gesture;",
  "HAVE AGREED AS FOLLOWS:",
] as const;

export const treatyTitles: readonly TreatyTitle[] = [
  {
    numeral: "I",
    title: "GENERAL PROVISIONS",
    articles: [
      {
        number: 1,
        title: "PURPOSE OF THE AGREEMENT",
        clauses: [
          "The Parties establish this Agreement as a record of affection, shared intentions and unusually ambitious bilateral cooperation. It is commemorative and symbolic only; it creates no legal rights or obligations.",
          "No provision shall be interpreted as a substitute for the daily choice to care for one another, nor as permission to issue formal notices over breakfast.",
        ],
      },
      {
        number: 2,
        title: "EQUALITY OF THE PARTIES",
        clauses: [
          "The Italian Party and the Colombian Party enjoy equal dignity, voice and standing under this Agreement.",
          "Neither Party acquires permanent authority over the other, including in matters of restaurant selection, thermostat policy or the correct route through an airport.",
        ],
      },
      {
        number: 3,
        title: "GOOD FAITH",
        clauses: [
          "The Parties shall speak honestly, act with respect and protect the trust placed in them.",
          "Knowledge of the other Party's vulnerabilities shall never be deployed as ammunition in a disagreement. A clever argument is not worth an avoidable wound.",
        ],
      },
      {
        number: 4,
        title: "DEFINITION OF LOVE",
        clauses: [
          "For the purposes of this Agreement, love means a free, continuing choice to know, support and delight in the other Party.",
          "It is not presumed from a signature, a calendar entry or the number of messages exchanged on any particular Tuesday.",
        ],
      },
      {
        number: 5,
        title: "INDIVIDUAL SOVEREIGNTY",
        clauses: [
          "Each Party retains full autonomy over personal aspirations, friendships, work, studies, body, time and future.",
          "The partnership shall make room for two whole people; it shall not require either person to become a smaller one.",
        ],
      },
    ],
  },
  {
    numeral: "II",
    title: "FUNDAMENTAL RIGHTS AND OBLIGATIONS",
    articles: [
      {
        number: 6,
        title: "THE RIGHT TO AFFECTION",
        clauses: [
          "Both Parties may ask for kisses, embraces, cuddles and other forms of affection, and are encouraged to provide them generously.",
          "Affection always depends on the other Party's freely given consent. A refusal requires no tribunal, appeal or dramatic closing statement.",
        ],
      },
      {
        number: 7,
        title: "THE RIGHT TO A DIFFICULT DAY",
        clauses: [
          "A difficult day does not constitute a breach of this Agreement. Either Party may be tired, sad, overwhelmed or temporarily less charming than usual.",
          "Where welcome, the other Party shall offer patience, practical help or quiet company, without insisting that every feeling be fixed immediately.",
        ],
      },
      {
        number: 8,
        title: "CELEBRATION OF ACHIEVEMENTS",
        clauses: [
          "The Parties shall celebrate each other's personal, academic and professional achievements, whether publicly impressive or privately hard-won.",
          "A small victory may justify a large dessert. The size of the dessert shall not diminish the seriousness of the achievement.",
        ],
      },
      {
        number: 9,
        title: "PERSONAL TIME",
        clauses: [
          "Each Party may request time alone, with friends or in pursuit of individual interests without that request being treated as rejection.",
          "Reasonable plans and expectations should be communicated with care; personal space is a healthy border, not an international incident.",
        ],
      },
      {
        number: 10,
        title: "MUTUAL PRESENCE",
        clauses: [
          "The Parties intend to be present for moments that matter to one another, including difficult conversations, milestones and ordinary evenings that turn out to matter later.",
          "When physical presence is impossible, attentive contact may serve as a provisional diplomatic mission.",
        ],
      },
    ],
  },
  {
    numeral: "III",
    title: "COMMUNICATION AND DIPLOMATIC RELATIONS",
    articles: [
      {
        number: 11,
        title: "PROHIBITION OF MIND READING",
        clauses: [
          "No Party is required to infer an unspoken need with supernatural accuracy. Requests should be expressed, and questions asked in good faith.",
          'The phrase "You should have known" may be entered into the record, but shall not be treated as conclusive evidence of telepathy.',
        ],
      },
      {
        number: 12,
        title: "THE RIGHT TO BE DRAMATIC",
        clauses: [
          "Both Parties reserve the right to occasional theatrical emphasis, provided it does not become cruelty, intimidation or an excuse not to listen.",
          "An eye-roll may be noted by the diplomatic observer; an honest conversation must still follow.",
        ],
      },
      {
        number: 13,
        title: "LONG-DISTANCE COMMUNICATION",
        clauses: [
          "During periods apart, the Parties shall seek a rhythm of calls and messages that respects time zones, work and each other's circumstances.",
          "A delayed reply is not, by itself, evidence of reduced affection. A reasonable heads-up is preferable when silence is likely to be unusually long.",
        ],
      },
      {
        number: 14,
        title: "THE GOODNIGHT PROTOCOL",
        clauses: [
          "When together and mutually willing, a goodnight kiss is strongly encouraged. When apart, a message or call may perform the same ceremonial function.",
          "Sleep, illness, travel and depleted phone batteries constitute acceptable exceptions without further paperwork.",
        ],
      },
      {
        number: 15,
        title: "INTERPRETATION OF MESSAGES",
        clauses: [
          'Short written replies, including "okay," shall be interpreted in context before a diplomatic crisis is declared.',
          "Where meaning is uncertain, the receiving Party should ask what was intended. Screenshots sent to an advisory committee are not the preferred first remedy.",
        ],
      },
    ],
  },
  {
    numeral: "IV",
    title: "ROMANCE, GIFTS AND SPECIAL COMMITMENTS",
    articles: [
      {
        number: 16,
        title: "ROMANTIC DATES",
        clauses: [
          "The Parties intend to make time for dates that feel intentional, whether grand, inexpensive, carefully planned or delightfully improvised.",
          "Being in the same room while separately reading restaurant reviews shall not, without further evidence, qualify as a date.",
        ],
      },
      {
        number: 17,
        title: "ROMANTIC SURPRISES",
        clauses: [
          "Either Party may arrange a surprise for the other, with due regard for preferences, schedules, consent and the practical possibility that the surprise recipient dislikes being blindfolded.",
          "The best surprise is one designed for the person receiving it, rather than for the organiser's reputation.",
        ],
      },
      {
        number: 18,
        title: "GIANMARIA'S GIFT COMMITMENT",
        clauses: [
          "The Italian Party expressly undertakes to demonstrate his affection through thoughtful gifts and romantic gestures.",
          "Such gestures may include birthday and anniversary gifts, flowers, surprises, spontaneous presents, romantic experiences and personalised objects. Their emotional meaning matters more than their price; no minimum expenditure is established.",
          "The Colombian Party may appreciate a handwritten note as much as an elaborate parcel. Gianmaria is advised not to use that observation as a permanent exemption from buying flowers.",
        ],
      },
      {
        number: 19,
        title: "EXTRAORDINARY ROMANTIC GESTURES",
        clauses: [
          "Subject to real-life circumstances, the Italian Party intends to arrange at least one particularly memorable romantic experience for each anniversary year.",
          'A routine supermarket visit shall not automatically constitute an "extraordinary romantic experience," even where both Parties successfully agree on the brand of pasta.',
        ],
      },
      {
        number: 20,
        title: "THE COLOMBIA COMMITMENT",
        clauses: [
          "Gianmaria Ferretti expressly declares his intention and personal commitment to visit Colombia no later than 31 December 2027.",
          "The purpose is to know Valentina's country more deeply. The Parties may choose the itinerary and duration together, taking account of safety, health and entry requirements.",
          "If extraordinary circumstances prevent travel by that date, Gianmaria shall propose a new one. This is a romantic promise, not a legally enforceable duty.",
        ],
      },
    ],
  },
  {
    numeral: "V",
    title: "ITALIAN–COLOMBIAN COOPERATION",
    articles: [
      {
        number: 21,
        title: "LINGUISTIC COOPERATION",
        clauses: [
          "The Italian Party intends to improve his Spanish; the Colombian Party is encouraged to continue her Italian journey through La Dolce Lingua and beyond.",
          "Mispronunciations should generally be met with help and good humour. Language practice is a bridge, not an oral examination at dinner.",
        ],
      },
      {
        number: 22,
        title: "CULTURAL EXCHANGE PROGRAMME",
        clauses: [
          "The Parties shall remain curious about each other's music, traditions, cinema, literature and everyday customs.",
          "Each Party may offer a cultural recommendation; the other may disagree respectfully, provided the recommendation received a fair hearing and not merely a suspicious glance.",
        ],
      },
      {
        number: 23,
        title: "GASTRONOMIC DISPUTES",
        clauses: [
          "Questions concerning pasta, pizza, arepas and empanadas shall be resolved, where practicable, by tasting rather than prolonged theoretical argument.",
          "Neither national cuisine is required to surrender. A second serving may be ordered for evidentiary purposes.",
        ],
      },
      {
        number: 24,
        title: "INTERNATIONAL RELATIONS",
        clauses: [
          "This relationship may unfold across different cities and countries. Distance does not equal disinterest, and a border does not reduce the importance of a person on the other side.",
          "The Parties will discuss travel, time and expectations plainly, recognising that longing is real but so are trains, budgets and passports.",
        ],
      },
      {
        number: 25,
        title: "JOINT TRAVEL AND EXPLORATION",
        clauses: [
          "The Parties intend to discover new places together, from famous capitals to the small street neither knew they would remember.",
          "Destinations and plans should be agreed with respect for both Parties' preferences, energy and practical limits. Getting lost may become a story; it is not compulsory.",
        ],
      },
    ],
  },
  {
    numeral: "VI",
    title: "DISPUTE RESOLUTION",
    articles: [
      {
        number: 26,
        title: "PEACEFUL RESOLUTION",
        clauses: [
          "Disagreements shall be approached through dialogue, respect and a genuine attempt to understand what happened.",
          "Either Party may request a pause when emotions are high; the discussion should be resumed when both can participate safely and fairly.",
        ],
      },
      {
        number: 27,
        title: "THE DIPLOMATIC NEGOTIATION PROTOCOL",
        clauses: [
          "During a dispute, each Party should state their own experience and seek to understand the other's before drafting a verdict.",
          "The purpose of negotiation is repair, not victory. No scoreboard shall be maintained, however tempting one Party may find the prospect.",
        ],
      },
      {
        number: 28,
        title: "PROHIBITION OF HISTORICAL WEAPONISATION",
        clauses: [
          "Old disagreements shall not be repeatedly deployed as weapons in a new argument merely because they remain available in the archives.",
          "An unresolved pattern may be discussed honestly, but the Parties should identify the present issue rather than reopen every previous file at once.",
        ],
      },
      {
        number: 29,
        title: "RECONCILIATION COMMISSION",
        clauses: [
          "After a disagreement, the Parties may propose a shared activity, an apology, practical amends or an affectionate gesture as part of reconciliation.",
          "Participation and affection must be freely accepted. A hug may help, but it shall not be used to cancel an overdue conversation.",
        ],
      },
      {
        number: 30,
        title: "NO UNILATERAL VICTORY",
        clauses: [
          "Neither Party shall treat the other as an opponent to be defeated in an argument.",
          'The expression "I told you so" is subject to a strict proportionality principle: if said at all, it must be brief, gentle and followed by useful assistance.',
        ],
      },
    ],
  },
  {
    numeral: "VII",
    title: "SPECIAL PRIVILEGES",
    articles: [
      {
        number: 31,
        title: "THE RIGHT TO CHOOSE THE MOVIE",
        clauses: [
          "The Parties shall alternate, in a spirit of reasonable fairness, the choice of films and television series.",
          "A veto should be reserved for genuine objections. Falling asleep during the chosen film shall not retrospectively invalidate the choice.",
        ],
      },
      {
        number: 32,
        title: "PROTECTION OF IMPORTANT DATES",
        clauses: [
          "Birthdays, anniversaries and significant milestones deserve deliberate attention, even when celebration must be postponed for practical reasons.",
          "Remembering the date is strongly advised; remembering why it matters is more important.",
        ],
      },
      {
        number: 33,
        title: "THE RIGHT TO PHOTOGRAPHS",
        clauses: [
          "The Parties may take photographs together to preserve their shared history, including the moments in which neither looks particularly prepared.",
          "Publication, sharing and storage of personal images require respect for privacy and consent. No photograph becomes public merely because it is lovely.",
        ],
      },
      {
        number: 34,
        title: "THE ROMANTIC REDEMPTION CLAUSE",
        clauses: [
          "If a Party forgets a small romantic occasion, that Party may propose a sincere gesture of repair, suited to the other person's wishes.",
          "No automatic fine, compulsory gift or punishment arises under this Article. An apology remains more useful than an elaborate excuse.",
        ],
      },
      {
        number: 35,
        title: "THE OSITO CLAUSE",
        clauses: [
          'The affectionate name "Osito" is recognised as a special designation within the private language of the Parties.',
          "Its use carries no rank, title or diplomatic immunity; it does, however, remain unusually effective.",
        ],
      },
    ],
  },
  {
    numeral: "VIII",
    title: "FINAL PROVISIONS",
    articles: [
      {
        number: 36,
        title: "AMENDMENTS",
        clauses: [
          "This commemorative text may be amended only with the knowledge and agreement of both Parties.",
          "A new version must be clearly identified. No signed wording may be silently replaced; a material revision calls for fresh signatures.",
        ],
      },
      {
        number: 37,
        title: "DURATION OF THE AGREEMENT",
        clauses: [
          "The initial symbolic term is five years, beginning on 31 October 2026 and ending on 31 October 2031.",
          "The calendar term describes this document alone. It does not set an expiry date for affection or require the relationship to continue until that date.",
        ],
      },
      {
        number: 38,
        title: "EARLY INDEFINITE RENEWAL THROUGH MARRIAGE",
        clauses: [
          "Beginning on the third anniversary of this Agreement, the Parties may, by mutual and freely expressed consent, elect to transform its fixed five-year symbolic term into an indefinite one through marriage.",
          "Marriage requires the independent, explicit consent of both Parties. Neither Party is obliged to marry; this Agreement is not a proposal, engagement or promise to marry, and neither this website nor its digital signatures can create a marriage.",
          "If no marriage takes place, the original five-year term remains unless the Parties mutually agree to renew this commemorative text.",
        ],
      },
      {
        number: 39,
        title: "FREEDOM OF THE PARTIES",
        clauses: [
          "This Agreement is symbolic, commemorative and not legally binding. It confers no power to limit either Party's freedom, including the freedom to end the relationship.",
          "A signature records a present feeling and intention; it is not consent to future acts, a waiver of autonomy or a guarantee about what life must become.",
        ],
      },
      {
        number: 40,
        title: "THE FUNDAMENTAL CLAUSE",
        clauses: [
          "The relationship exists not because forty Articles say so, but because two people keep choosing one another in ordinary life.",
          "If the Parties build a future together, it will be made of care, patience, laughter, honest repair and the courage to begin again after an imperfect day. That future remains theirs to choose.",
        ],
      },
    ],
  },
] as const;

export const treatyArticleCount = treatyTitles.reduce(
  (count, title) => count + title.articles.length,
  0,
);
