const WORD_LIST = [
  {
    id: 1,
    word: "abandon",
    pos: "verb",
    phonetic: "/əˈbændən/",
    zh: "放弃；遗弃",
    en: "to leave somebody/something and not return; to give up something completely",
    examples: [
      "The crew abandoned the sinking ship.",
      "She abandoned her plans to go abroad."
    ],
    level: "B2"
  },
  {
    id: 2,
    word: "abstract",
    pos: "adjective",
    phonetic: "/ˈæbstrækt/",
    zh: "抽象的",
    en: "existing in thought or as an idea but not having a physical reality",
    examples: [
      "Abstract concepts like justice and freedom are hard to define.",
      "The painting was entirely abstract, with no recognizable shapes."
    ],
    level: "B2"
  },
  {
    id: 3,
    word: "absurd",
    pos: "adjective",
    phonetic: "/əbˈsɜːrd/",
    zh: "荒谬的；荒唐的",
    en: "completely ridiculous; not logical or sensible",
    examples: [
      "It would be absurd to expect everyone to agree.",
      "The plot of the movie was completely absurd."
    ],
    level: "B2"
  },
  {
    id: 4,
    word: "abuse",
    pos: "noun",
    phonetic: "/əˈbjuːs/",
    zh: "滥用；虐待",
    en: "the use of something in a way that is wrong or harmful; cruel treatment",
    examples: [
      "The abuse of power by officials led to widespread protests.",
      "The charity works to protect children from abuse."
    ],
    level: "B2"
  },
  {
    id: 5,
    word: "accelerate",
    pos: "verb",
    phonetic: "/əkˈseləreɪt/",
    zh: "加速；促进",
    en: "to happen or to make something happen faster or earlier than expected",
    examples: [
      "The car accelerated smoothly as it entered the motorway.",
      "We need to accelerate the pace of reform."
    ],
    level: "B2"
  },
  {
    id: 6,
    word: "accumulate",
    pos: "verb",
    phonetic: "/əˈkjuːmjəleɪt/",
    zh: "积累；积聚",
    en: "to gradually get more and more of something over a period of time",
    examples: [
      "She accumulated a large collection of books over the years.",
      "Dust had accumulated on the shelves during our absence."
    ],
    level: "B2"
  },
  {
    id: 7,
    word: "acknowledge",
    pos: "verb",
    phonetic: "/əkˈnɒlɪdʒ/",
    zh: "承认；确认",
    en: "to accept that something is true or exists",
    examples: [
      "He acknowledged that he had made a mistake.",
      "She refused to acknowledge his presence in the room."
    ],
    level: "B2"
  },
  {
    id: 8,
    word: "acquisition",
    pos: "noun",
    phonetic: "/ˌækwɪˈzɪʃn/",
    zh: "获得；收购",
    en: "the act of obtaining or buying something, especially property or a company",
    examples: [
      "The acquisition of the smaller company took several months.",
      "Language acquisition is easier for young children."
    ],
    level: "B2"
  },
  {
    id: 9,
    word: "adapt",
    pos: "verb",
    phonetic: "/əˈdæpt/",
    zh: "适应；改编",
    en: "to change your behaviour in order to deal more successfully with a new situation",
    examples: [
      "It took him a while to adapt to his new school.",
      "The novel was adapted for television."
    ],
    level: "B2"
  },
  {
    id: 10,
    word: "adequate",
    pos: "adjective",
    phonetic: "/ˈædɪkwət/",
    zh: "足够的；合格的",
    en: "enough in quantity, or good enough in quality, for a particular purpose",
    examples: [
      "The room was small but adequate for our needs.",
      "Make sure you allow adequate time for the journey."
    ],
    level: "B2"
  },
  {
    id: 11,
    word: "advocate",
    pos: "verb",
    phonetic: "/ˈædvəkeɪt/",
    zh: "提倡；拥护",
    en: "to support or recommend something publicly",
    examples: [
      "She advocates equal rights for all citizens.",
      "Many experts advocate a healthy diet and regular exercise."
    ],
    level: "B2"
  },
  {
    id: 12,
    word: "aggression",
    pos: "noun",
    phonetic: "/əˈɡreʃn/",
    zh: "侵略；攻击性",
    en: "feelings of anger and hatred that may result in threatening or violent behaviour",
    examples: [
      "He struggled to control his aggression.",
      "The act of aggression was condemned by the international community."
    ],
    level: "B2"
  },
  {
    id: 13,
    word: "allocate",
    pos: "verb",
    phonetic: "/ˈæləkeɪt/",
    zh: "分配；拨出",
    en: "to give something officially to somebody/something for a particular purpose",
    examples: [
      "The government allocated funds for the new hospital.",
      "Each student was allocated a locker."
    ],
    level: "B2"
  },
  {
    id: 14,
    word: "allowance",
    pos: "noun",
    phonetic: "/əˈlaʊəns/",
    zh: "津贴；零用钱",
    en: "an amount of money that is given to somebody regularly or for a particular purpose",
    examples: [
      "He receives a monthly allowance from his parents.",
      "The company provides a travel allowance for employees."
    ],
    level: "B2"
  },
  {
    id: 15,
    word: "ambiguous",
    pos: "adjective",
    phonetic: "/æmˈbɪɡjuəs/",
    zh: "模棱两可的；含糊不清的",
    en: "that can be understood in more than one way; having different meanings",
    examples: [
      "The wording of the contract was deliberately ambiguous.",
      "His reply was ambiguous and left us confused."
    ],
    level: "B2"
  },
  {
    id: 16,
    word: "ambition",
    pos: "noun",
    phonetic: "/æmˈbɪʃn/",
    zh: "雄心；抱负",
    en: "a strong desire to achieve something, especially success or power",
    examples: [
      "Her ambition is to become a surgeon.",
      "He was driven by ambition from an early age."
    ],
    level: "B2"
  },
  {
    id: 17,
    word: "amend",
    pos: "verb",
    phonetic: "/əˈmend/",
    zh: "修改；修正",
    en: "to change a law, document, or statement slightly in order to correct a mistake or improve it",
    examples: [
      "The law was amended to include new regulations.",
      "He asked to amend his previous statement."
    ],
    level: "B2"
  },
  {
    id: 18,
    word: "anticipate",
    pos: "verb",
    phonetic: "/ænˈtɪsɪpeɪt/",
    zh: "预期；预料",
    en: "to expect something and prepare for it",
    examples: [
      "We anticipate that demand will increase next year.",
      "The police had anticipated trouble at the demonstration."
    ],
    level: "B2"
  },
  {
    id: 19,
    word: "anxiety",
    pos: "noun",
    phonetic: "/æŋˈzaɪəti/",
    zh: "焦虑；不安",
    en: "the state of feeling nervous or worried that something bad is going to happen",
    examples: [
      "She felt a growing sense of anxiety before the exam.",
      "His anxiety about the future kept him awake at night."
    ],
    level: "B2"
  },
  {
    id: 20,
    word: "apparatus",
    pos: "noun",
    phonetic: "/ˌæpəˈreɪtəs/",
    zh: "设备；器械",
    en: "the tools or other pieces of equipment needed for a particular activity or task",
    examples: [
      "The laboratory was equipped with modern apparatus.",
      "Firefighters wore breathing apparatus to enter the building."
    ],
    level: "B2"
  },
  {
    id: 21,
    word: "appetite",
    pos: "noun",
    phonetic: "/ˈæpɪtaɪt/",
    zh: "食欲；欲望",
    en: "a physical desire for food; a strong desire or liking for something",
    examples: [
      "Exercise gave her a good appetite.",
      "He had an insatiable appetite for knowledge."
    ],
    level: "B2"
  },
  {
    id: 22,
    word: "applaud",
    pos: "verb",
    phonetic: "/əˈplɔːd/",
    zh: "鼓掌；赞赏",
    en: "to show approval by clapping hands; to express strong approval of something",
    examples: [
      "The audience applauded loudly at the end of the performance.",
      "We applaud the government's decision to invest in education."
    ],
    level: "B2"
  },
  {
    id: 23,
    word: "appoint",
    pos: "verb",
    phonetic: "/əˈpɔɪnt/",
    zh: "任命；指定",
    en: "to choose somebody for a job or position of responsibility",
    examples: [
      "She was appointed as the new head of department.",
      "The committee appointed a time for the next meeting."
    ],
    level: "B2"
  },
  {
    id: 24,
    word: "appreciation",
    pos: "noun",
    phonetic: "/əˌpriːʃiˈeɪʃn/",
    zh: "欣赏；感激",
    en: "the feeling of being grateful for something; understanding of the value of something",
    examples: [
      "She expressed her appreciation for his help.",
      "The course gave me a greater appreciation of classical music."
    ],
    level: "B2"
  },
  {
    id: 25,
    word: "arbitrary",
    pos: "adjective",
    phonetic: "/ˈɑːrbɪtreri/",
    zh: "任意的；武断的",
    en: "not seeming to be based on a reason, system, or plan and sometimes seeming unfair",
    examples: [
      "The choice of colour was completely arbitrary.",
      "The decision seemed arbitrary and unjust."
    ],
    level: "B2"
  },
  {
    id: 26,
    word: "arise",
    pos: "verb",
    phonetic: "/əˈraɪz/",
    zh: "出现；产生",
    en: "to happen; to start to exist or develop",
    examples: [
      "A number of problems arose during the project.",
      "Should the need arise, we can hire extra staff."
    ],
    level: "B2"
  },
  {
    id: 27,
    word: "aspect",
    pos: "noun",
    phonetic: "/ˈæspekt/",
    zh: "方面；层面",
    en: "a particular part or feature of a situation, plan, or subject",
    examples: [
      "We need to consider every aspect of the problem.",
      "The book covers all aspects of city life."
    ],
    level: "B2"
  },
  {
    id: 28,
    word: "assert",
    pos: "verb",
    phonetic: "/əˈsɜːrt/",
    zh: "断言；主张",
    en: "to state something clearly and firmly as being true",
    examples: [
      "He asserted that he was innocent of the charges.",
      "She asserted her right to make her own decisions."
    ],
    level: "B2"
  },
  {
    id: 29,
    word: "assess",
    pos: "verb",
    phonetic: "/əˈses/",
    zh: "评估；评价",
    en: "to make a judgement about the nature or quality of something",
    examples: [
      "It is difficult to assess the impact of the new law.",
      "Students are assessed through a combination of exams and coursework."
    ],
    level: "B2"
  },
  {
    id: 30,
    word: "assumption",
    pos: "noun",
    phonetic: "/əˈsʌmpʃn/",
    zh: "假设；假定",
    en: "a belief or feeling that something is true or that something will happen, although there is no proof",
    examples: [
      "We are working on the assumption that everyone invited will attend.",
      "It is a common assumption that money brings happiness."
    ],
    level: "B2"
  },
  {
    id: 31,
    word: "assure",
    pos: "verb",
    phonetic: "/əˈʃʊr/",
    zh: "保证；使确信",
    en: "to tell somebody that something is definitely true or is definitely going to happen",
    examples: [
      "I assure you that the matter will be dealt with promptly.",
      "He assured her of his full support."
    ],
    level: "B2"
  },
  {
    id: 32,
    word: "attachment",
    pos: "noun",
    phonetic: "/əˈtætʃmənt/",
    zh: "附件；依恋",
    en: "a strong feeling of affection for somebody/something; a file sent with an email",
    examples: [
      "She felt a deep attachment to her childhood home.",
      "Please find the report as an attachment to this email."
    ],
    level: "B2"
  },
  {
    id: 33,
    word: "attain",
    pos: "verb",
    phonetic: "/əˈteɪn/",
    zh: "达到；获得",
    en: "to succeed in getting something, usually after a lot of effort",
    examples: [
      "She attained the highest grade in the class.",
      "He attained the rank of colonel before retiring."
    ],
    level: "B2"
  },
  {
    id: 34,
    word: "authentic",
    pos: "adjective",
    phonetic: "/ɔːˈθentɪk/",
    zh: "真正的；真实的",
    en: "known to be real and genuine and not a copy",
    examples: [
      "The painting was confirmed to be an authentic Picasso.",
      "The restaurant serves authentic Italian cuisine."
    ],
    level: "B2"
  },
  {
    id: 35,
    word: "authorize",
    pos: "verb",
    phonetic: "/ˈɔːθəraɪz/",
    zh: "授权；批准",
    en: "to give official permission for something, or for somebody to do something",
    examples: [
      "Only the manager is authorized to sign contracts.",
      "The government authorized the use of military force."
    ],
    level: "B2"
  },
  {
    id: 36,
    word: "awkward",
    pos: "adjective",
    phonetic: "/ˈɔːkwərd/",
    zh: "尴尬的；笨拙的",
    en: "making you feel embarrassed; difficult to deal with",
    examples: [
      "There was an awkward silence after he finished speaking.",
      "The box was an awkward shape to carry."
    ],
    level: "B2"
  },
  {
    id: 37,
    word: "barrier",
    pos: "noun",
    phonetic: "/ˈbæriər/",
    zh: "障碍；屏障",
    en: "a problem, rule, or situation that prevents somebody from doing something",
    examples: [
      "Language is often a barrier to communication.",
      "The government wants to remove trade barriers."
    ],
    level: "B2"
  },
  {
    id: 38,
    word: "behalf",
    pos: "noun",
    phonetic: "/bɪˈhɑːf/",
    zh: "代表；利益",
    en: "in the interests of; as a representative of",
    examples: [
      "On behalf of the entire team, I would like to thank you.",
      "The lawyer spoke on behalf of his client."
    ],
    level: "B2"
  },
  {
    id: 39,
    word: "bias",
    pos: "noun",
    phonetic: "/ˈbaɪəs/",
    zh: "偏见；偏向",
    en: "a strong feeling in favour of or against one group of people or one side in an argument",
    examples: [
      "The report showed clear bias against women.",
      "Journalists must avoid political bias in their reporting."
    ],
    level: "B2"
  },
  {
    id: 40,
    word: "bold",
    pos: "adjective",
    phonetic: "/bəʊld/",
    zh: "大胆的；醒目的",
    en: "brave and confident; not afraid to say what you feel",
    examples: [
      "It was a bold decision to expand overseas.",
      "She made a bold statement about the company's future."
    ],
    level: "B2"
  },
  {
    id: 41,
    word: "boom",
    pos: "noun",
    phonetic: "/buːm/",
    zh: "繁荣；激增",
    en: "a sudden increase in trade and economic activity; a period of wealth and success",
    examples: [
      "The technology boom created thousands of new jobs.",
      "House prices rose sharply during the property boom."
    ],
    level: "B2"
  },
  {
    id: 42,
    word: "breach",
    pos: "noun",
    phonetic: "/briːtʃ/",
    zh: "违反；缺口",
    en: "a failure to do something that must be done by law; an act of breaking a rule or agreement",
    examples: [
      "This is a clear breach of the contract.",
      "The data breach affected millions of customers."
    ],
    level: "B2"
  },
  {
    id: 43,
    word: "breakthrough",
    pos: "noun",
    phonetic: "/ˈbreɪkθruː/",
    zh: "突破；重大进展",
    en: "an important development that may lead to an achievement or solution",
    examples: [
      "Scientists have made a major breakthrough in cancer research.",
      "The negotiations led to a diplomatic breakthrough."
    ],
    level: "B2"
  },
  {
    id: 44,
    word: "burden",
    pos: "noun",
    phonetic: "/ˈbɜːrdn/",
    zh: "负担；重荷",
    en: "a duty, responsibility, etc. that causes worry, difficulty, or hard work",
    examples: [
      "The tax burden falls most heavily on the poor.",
      "She didn't want to be a burden on her family."
    ],
    level: "B2"
  },
  {
    id: 45,
    word: "bureaucracy",
    pos: "noun",
    phonetic: "/bjʊˈrɒkrəsi/",
    zh: "官僚主义；官僚机构",
    en: "the system of official rules and ways of doing things that a government or organization has",
    examples: [
      "The project was delayed by unnecessary bureaucracy.",
      "We need to cut through the bureaucracy to get things done."
    ],
    level: "B2"
  },
  {
    id: 46,
    word: "capability",
    pos: "noun",
    phonetic: "/ˌkeɪpəˈbɪləti/",
    zh: "能力；才能",
    en: "the ability or qualities necessary to do something",
    examples: [
      "The country has the capability to produce nuclear weapons.",
      "She has the capability to become an excellent leader."
    ],
    level: "B2"
  },
  {
    id: 47,
    word: "carbon",
    pos: "noun",
    phonetic: "/ˈkɑːrbən/",
    zh: "碳",
    en: "a chemical element that is found in all living things and in its pure form as diamond and graphite",
    examples: [
      "We need to reduce our carbon emissions.",
      "Carbon dioxide is a major greenhouse gas."
    ],
    level: "B2"
  },
  {
    id: 48,
    word: "chaos",
    pos: "noun",
    phonetic: "/ˈkeɪɒs/",
    zh: "混乱；混沌",
    en: "a state of complete confusion and disorder",
    examples: [
      "The country was plunged into chaos after the coup.",
      "The traffic was in complete chaos due to the accident."
    ],
    level: "B2"
  },
  {
    id: 49,
    word: "chronic",
    pos: "adjective",
    phonetic: "/ˈkrɒnɪk/",
    zh: "慢性的；长期的",
    en: "lasting for a long time; difficult to cure or get rid of",
    examples: [
      "She suffers from chronic back pain.",
      "Chronic unemployment remains a serious problem in the region."
    ],
    level: "B2"
  },
  {
    id: 50,
    word: "circulate",
    pos: "verb",
    phonetic: "/ˈsɜːrkjəleɪt/",
    zh: "流通；传播",
    en: "to move around continuously; to pass from one person or place to another",
    examples: [
      "Blood circulates through the body.",
      "Rumours began to circulate about the company's financial troubles."
    ],
    level: "B2"
  },
  {
    id: 51,
    word: "cite",
    pos: "verb",
    phonetic: "/saɪt/",
    zh: "引用；提及",
    en: "to mention something as a reason or an example, or in order to support what you are saying",
    examples: [
      "She cited several studies to support her argument.",
      "He was cited for bravery during the war."
    ],
    level: "B2"
  },
  {
    id: 52,
    word: "civilian",
    pos: "noun",
    phonetic: "/sɪˈvɪliən/",
    zh: "平民；百姓",
    en: "a person who is not a member of the armed forces or the police",
    examples: [
      "Many civilians were killed during the conflict.",
      "The soldiers were dressed in civilian clothes."
    ],
    level: "B2"
  },
  {
    id: 53,
    word: "clarify",
    pos: "verb",
    phonetic: "/ˈklærəfaɪ/",
    zh: "澄清；阐明",
    en: "to make something clearer or easier to understand",
    examples: [
      "Could you clarify what you mean by that?",
      "The spokesperson clarified the government's position on the issue."
    ],
    level: "B2"
  },
  {
    id: 54,
    word: "clause",
    pos: "noun",
    phonetic: "/klɔːz/",
    zh: "条款；从句",
    en: "an item in a legal document that says something must or must not be done",
    examples: [
      "There is a clause in the contract about working hours.",
      "The escape clause allows either party to withdraw."
    ],
    level: "B2"
  },
  {
    id: 55,
    word: "coalition",
    pos: "noun",
    phonetic: "/ˌkəʊəˈlɪʃn/",
    zh: "联盟；联合",
    en: "a government formed by two or more political parties working together; a group of people who join together for a common purpose",
    examples: [
      "The two parties formed a coalition government.",
      "A coalition of environmental groups campaigned against the project."
    ],
    level: "B2"
  },
  {
    id: 56,
    word: "cognitive",
    pos: "adjective",
    phonetic: "/ˈkɒɡnətɪv/",
    zh: "认知的",
    en: "connected with mental processes of understanding",
    examples: [
      "Cognitive skills develop rapidly in early childhood.",
      "The disease causes a decline in cognitive function."
    ],
    level: "B2"
  },
  {
    id: 57,
    word: "coincide",
    pos: "verb",
    phonetic: "/ˌkəʊɪnˈsaɪd/",
    zh: "同时发生；一致",
    en: "to take place at the same time; to be the same or similar",
    examples: [
      "The festival coincides with the school holidays.",
      "Her account of what happened coincided with his."
    ],
    level: "B2"
  },
  {
    id: 58,
    word: "colleague",
    pos: "noun",
    phonetic: "/ˈkɒliːɡ/",
    zh: "同事",
    en: "a person that you work with, especially in a profession or a business",
    examples: [
      "She discussed the project with her colleagues.",
      "He is well respected by his colleagues."
    ],
    level: "B2"
  },
  {
    id: 59,
    word: "commence",
    pos: "verb",
    phonetic: "/kəˈmens/",
    zh: "开始；着手",
    en: "to begin to happen; to begin something",
    examples: [
      "The ceremony will commence at ten o'clock.",
      "She commenced work on the project immediately."
    ],
    level: "B2"
  },
  {
    id: 60,
    word: "commentary",
    pos: "noun",
    phonetic: "/ˈkɒməntri/",
    zh: "评论；解说",
    en: "a spoken description of an event that is given while it is happening; a written explanation or discussion",
    examples: [
      "He provided live commentary on the football match.",
      "The book offers a detailed commentary on modern society."
    ],
    level: "B2"
  },
  {
    id: 61,
    word: "commerce",
    pos: "noun",
    phonetic: "/ˈkɒmɜːrs/",
    zh: "商业；贸易",
    en: "trade, especially between countries; the buying and selling of goods and services",
    examples: [
      "International commerce has grown rapidly in recent years.",
      "The chamber of commerce supports local businesses."
    ],
    level: "B2"
  },
  {
    id: 62,
    word: "commission",
    pos: "noun",
    phonetic: "/kəˈmɪʃn/",
    zh: "委员会；佣金",
    en: "an official group of people who have been given responsibility to control something or to find out about something",
    examples: [
      "The government set up a commission to investigate the disaster.",
      "She earns a commission on every sale she makes."
    ],
    level: "B2"
  },
  {
    id: 63,
    word: "commitment",
    pos: "noun",
    phonetic: "/kəˈmɪtmənt/",
    zh: "承诺；投入",
    en: "a promise or firm decision to do something; willingness to give your time and energy to something",
    examples: [
      "The company made a commitment to reduce its carbon footprint.",
      "Teaching requires a strong commitment to helping students learn."
    ],
    level: "B2"
  },
  {
    id: 64,
    word: "commodity",
    pos: "noun",
    phonetic: "/kəˈmɒdəti/",
    zh: "商品；日用品",
    en: "a product or a raw material that can be bought and sold",
    examples: [
      "Oil is one of the world's most valuable commodities.",
      "Basic commodities like rice and wheat have risen in price."
    ],
    level: "B2"
  },
  {
    id: 65,
    word: "companion",
    pos: "noun",
    phonetic: "/kəmˈpæniən/",
    zh: "同伴；伙伴",
    en: "a person or animal you travel with or spend a lot of time with",
    examples: [
      "His dog was his constant companion.",
      "She made a wonderful travelling companion."
    ],
    level: "B2"
  },
  {
    id: 66,
    word: "compel",
    pos: "verb",
    phonetic: "/kəmˈpel/",
    zh: "强迫；迫使",
    en: "to force somebody to do something; to make something necessary",
    examples: [
      "The law compels employers to provide safe working conditions.",
      "He felt compelled to speak out against the injustice."
    ],
    level: "B2"
  },
  {
    id: 67,
    word: "compensate",
    pos: "verb",
    phonetic: "/ˈkɒmpenseɪt/",
    zh: "补偿；弥补",
    en: "to provide something good to balance or reduce the bad effects of something",
    examples: [
      "The company compensated the workers for their injuries.",
      "Nothing can compensate for the loss of a loved one."
    ],
    level: "B2"
  },
  {
    id: 68,
    word: "competent",
    pos: "adjective",
    phonetic: "/ˈkɒmpɪtənt/",
    zh: "有能力的；胜任的",
    en: "having enough skill or knowledge to do something well",
    examples: [
      "She is a highly competent manager.",
      "You need to be competent in at least two languages."
    ],
    level: "B2"
  },
  {
    id: 69,
    word: "compile",
    pos: "verb",
    phonetic: "/kəmˈpaɪl/",
    zh: "编纂；汇编",
    en: "to produce a book, list, or report by bringing together different items, articles, or pieces of information",
    examples: [
      "She compiled a list of all the participants.",
      "The report was compiled from data collected over five years."
    ],
    level: "B2"
  },
  {
    id: 70,
    word: "complement",
    pos: "verb",
    phonetic: "/ˈkɒmplɪment/",
    zh: "补充；使完善",
    en: "to add to something in a way that improves it or makes it more attractive",
    examples: [
      "The wine complemented the food perfectly.",
      "The two systems complement each other well."
    ],
    level: "B2"
  },
  {
    id: 71,
    word: "complexity",
    pos: "noun",
    phonetic: "/kəmˈpleksəti/",
    zh: "复杂性",
    en: "the state of being made up of many parts and being difficult to understand",
    examples: [
      "The complexity of the problem requires careful analysis.",
      "He failed to grasp the complexity of the situation."
    ],
    level: "B2"
  },
  {
    id: 72,
    word: "comply",
    pos: "verb",
    phonetic: "/kəmˈplaɪ/",
    zh: "遵守；服从",
    en: "to obey a rule, an order, etc.",
    examples: [
      "All companies must comply with health and safety regulations.",
      "He refused to comply with the court order."
    ],
    level: "B2"
  },
  {
    id: 73,
    word: "comprehensive",
    pos: "adjective",
    phonetic: "/ˌkɒmprɪˈhensɪv/",
    zh: "全面的；综合的",
    en: "including all, or almost all, the items, details, facts, or information that may be involved",
    examples: [
      "We offer a comprehensive range of services.",
      "The report provides a comprehensive overview of the market."
    ],
    level: "B2"
  },
  {
    id: 74,
    word: "compromise",
    pos: "noun",
    phonetic: "/ˈkɒmprəmaɪz/",
    zh: "妥协；折中",
    en: "an agreement made between two sides in which each side gives up some of the things they want",
    examples: [
      "After long negotiations, they reached a compromise.",
      "Neither side was willing to make a compromise."
    ],
    level: "B2"
  },
  {
    id: 75,
    word: "conceive",
    pos: "verb",
    phonetic: "/kənˈsiːv/",
    zh: "构想；设想",
    en: "to form an idea, a plan, etc. in your mind; to imagine something",
    examples: [
      "He could not conceive of a world without music.",
      "The project was originally conceived as a small experiment."
    ],
    level: "B2"
  },
  {
    id: 76,
    word: "concrete",
    pos: "adjective",
    phonetic: "/ˈkɒŋkriːt/",
    zh: "具体的；实在的",
    en: "based on facts, not on ideas or guesses; definite and specific",
    examples: [
      "We need concrete evidence before we can act.",
      "Do you have any concrete proposals for reform?"
    ],
    level: "B2"
  },
  {
    id: 77,
    word: "condemn",
    pos: "verb",
    phonetic: "/kənˈdem/",
    zh: "谴责；判刑",
    en: "to express very strong disapproval of somebody/something",
    examples: [
      "The government condemned the terrorist attack.",
      "He was condemned to life in prison."
    ],
    level: "B2"
  },
  {
    id: 78,
    word: "confine",
    pos: "verb",
    phonetic: "/kənˈfaɪn/",
    zh: "限制；关押",
    en: "to keep somebody/something inside the limits of a particular activity, subject, or area",
    examples: [
      "The discussion should be confined to the topic at hand.",
      "The prisoners were confined to their cells."
    ],
    level: "B2"
  },
  {
    id: 79,
    word: "conform",
    pos: "verb",
    phonetic: "/kənˈfɔːrm/",
    zh: "遵从；符合",
    en: "to behave and think in the same way as most other people in a group or society",
    examples: [
      "There is pressure on young people to conform.",
      "The building does not conform to safety regulations."
    ],
    level: "B2"
  },
  {
    id: 80,
    word: "confront",
    pos: "verb",
    phonetic: "/kənˈfrʌnt/",
    zh: "面对；对抗",
    en: "to deal with a problem or difficult situation; to face somebody that you do not want to meet",
    examples: [
      "She decided to confront her fears.",
      "We are confronted with a serious environmental crisis."
    ],
    level: "B2"
  },
  {
    id: 81,
    word: "conscience",
    pos: "noun",
    phonetic: "/ˈkɒnʃəns/",
    zh: "良心；良知",
    en: "the part of your mind that tells you whether your actions are right or wrong",
    examples: [
      "He had a guilty conscience about lying to his friend.",
      "She acted according to her conscience."
    ],
    level: "B2"
  },
  {
    id: 82,
    word: "consensus",
    pos: "noun",
    phonetic: "/kənˈsensəs/",
    zh: "共识；一致意见",
    en: "an opinion that all members of a group agree with",
    examples: [
      "There is a general consensus that education needs to be improved.",
      "The committee failed to reach a consensus."
    ],
    level: "B2"
  },
  {
    id: 83,
    word: "consent",
    pos: "noun",
    phonetic: "/kənˈsent/",
    zh: "同意；许可",
    en: "permission to do something, especially given by somebody in authority",
    examples: [
      "Children under 16 cannot give consent for medical treatment.",
      "He gave his written consent to the arrangement."
    ],
    level: "B2"
  },
  {
    id: 84,
    word: "conservation",
    pos: "noun",
    phonetic: "/ˌkɒnsəˈveɪʃn/",
    zh: "保护；保存",
    en: "the protection of the natural environment; prevention of loss or waste",
    examples: [
      "Wildlife conservation is essential for maintaining biodiversity.",
      "Energy conservation can help reduce utility bills."
    ],
    level: "B2"
  },
  {
    id: 85,
    word: "consistent",
    pos: "adjective",
    phonetic: "/kənˈsɪstənt/",
    zh: "一致的；始终如一的",
    en: "always behaving in the same way, or having the same opinions or standards",
    examples: [
      "Her work has been of a consistently high standard.",
      "The results are consistent with earlier research."
    ],
    level: "B2"
  },
  {
    id: 86,
    word: "constitute",
    pos: "verb",
    phonetic: "/ˈkɒnstɪtjuːt/",
    zh: "构成；组成",
    en: "to be the parts that together form something; to be considered to be something",
    examples: [
      "Women constitute over 50% of the population.",
      "This does not constitute a breach of the law."
    ],
    level: "B2"
  },
  {
    id: 87,
    word: "consult",
    pos: "verb",
    phonetic: "/kənˈsʌlt/",
    zh: "咨询；查阅",
    en: "to go to somebody for information or advice; to look something up in a book, etc.",
    examples: [
      "You should consult a doctor if the symptoms persist.",
      "She consulted the dictionary for the meaning of the word."
    ],
    level: "B2"
  },
  {
    id: 88,
    word: "contemplate",
    pos: "verb",
    phonetic: "/ˈkɒntəmpleɪt/",
    zh: "沉思；考虑",
    en: "to think about whether you should do something, or how to do something",
    examples: [
      "She contemplated leaving her job.",
      "He sat by the lake, contemplating the beauty of nature."
    ],
    level: "B2"
  },
  {
    id: 89,
    word: "contempt",
    pos: "noun",
    phonetic: "/kənˈtempt/",
    zh: "蔑视；轻视",
    en: "the feeling that somebody/something is without value and deserves no respect",
    examples: [
      "She looked at him with contempt.",
      "He held the rules in contempt."
    ],
    level: "B2"
  },
  {
    id: 90,
    word: "contradiction",
    pos: "noun",
    phonetic: "/ˌkɒntrəˈdɪkʃn/",
    zh: "矛盾；反驳",
    en: "a lack of agreement between facts, opinions, or actions",
    examples: [
      "There is a contradiction between what he says and what he does.",
      "The statement is full of contradictions."
    ],
    level: "B2"
  },
  {
    id: 91,
    word: "contrary",
    pos: "adjective",
    phonetic: "/ˈkɒntrəri/",
    zh: "相反的；对立的",
    en: "opposite in nature, direction, or meaning",
    examples: [
      "Contrary to popular belief, the earth is not perfectly round.",
      "The results were contrary to expectations."
    ],
    level: "B2"
  },
  {
    id: 92,
    word: "controversy",
    pos: "noun",
    phonetic: "/ˈkɒntrəvɜːrsi/",
    zh: "争议；争论",
    en: "public discussion and argument about something that many people strongly disagree about",
    examples: [
      "The new policy has caused a lot of controversy.",
      "There is considerable controversy surrounding the use of AI."
    ],
    level: "B2"
  },
  {
    id: 93,
    word: "convention",
    pos: "noun",
    phonetic: "/kənˈvenʃn/",
    zh: "惯例；大会",
    en: "the way in which something is done that most people in a society expect and consider to be polite or the right way",
    examples: [
      "It is a convention to shake hands when you meet someone.",
      "The party held its annual convention in Chicago."
    ],
    level: "B2"
  },
  {
    id: 94,
    word: "convey",
    pos: "verb",
    phonetic: "/kənˈveɪ/",
    zh: "传达；表达",
    en: "to make ideas, feelings, etc. known to somebody",
    examples: [
      "Please convey my best wishes to your family.",
      "The film conveys a powerful message about justice."
    ],
    level: "B2"
  },
  {
    id: 95,
    word: "cooperate",
    pos: "verb",
    phonetic: "/kəʊˈɒpəreɪt/",
    zh: "合作；配合",
    en: "to work together with somebody else in order to achieve something",
    examples: [
      "The two companies agreed to cooperate on the project.",
      "The suspect refused to cooperate with the police."
    ],
    level: "B2"
  },
  {
    id: 96,
    word: "correspond",
    pos: "verb",
    phonetic: "/ˌkɒrɪˈspɒnd/",
    zh: "通信；相当",
    en: "to be the same as or match something; to exchange letters with somebody",
    examples: [
      "The two accounts of the event do not correspond.",
      "She corresponded regularly with friends abroad."
    ],
    level: "B2"
  },
  {
    id: 97,
    word: "corruption",
    pos: "noun",
    phonetic: "/kəˈrʌpʃn/",
    zh: "腐败；贪污",
    en: "dishonest or illegal behaviour, especially by people in positions of power",
    examples: [
      "The country has a long history of political corruption.",
      "Anti-corruption measures have been strengthened."
    ],
    level: "B2"
  },
  {
    id: 98,
    word: "counsellor",
    pos: "noun",
    phonetic: "/ˈkaʊnsələr/",
    zh: "顾问；辅导员",
    en: "a person who has been trained to advise people with problems, especially personal problems",
    examples: [
      "She went to see a counsellor about her anxiety.",
      "The school employs a full-time counsellor for students."
    ],
    level: "B2"
  },
  {
    id: 99,
    word: "counterpart",
    pos: "noun",
    phonetic: "/ˈkaʊntəpɑːrt/",
    zh: "对应的人或物",
    en: "a person or thing that has the same position or function as somebody/something else in a different situation",
    examples: [
      "The minister met with her counterpart in the neighbouring country.",
      "The American dollar and its European counterpart, the euro, both fell in value."
    ],
    level: "B2"
  },
  {
    id: 100,
    word: "crawl",
    pos: "verb",
    phonetic: "/krɔːl/",
    zh: "爬行；缓慢移动",
    en: "to move forward on your hands and knees; to move slowly",
    examples: [
      "The baby started to crawl at nine months.",
      "Traffic was crawling along the motorway."
    ],
    level: "B2"
  },
  {
    id: 101,
    word: "crucial",
    pos: "adjective",
    phonetic: "/ˈkruːʃl/",
    zh: "至关重要的",
    en: "extremely important, because it will affect other things",
    examples: [
      "Timing is crucial to the success of the plan.",
      "It is crucial that we act now to protect the environment."
    ],
    level: "B2"
  },
  {
    id: 102,
    word: "curriculum",
    pos: "noun",
    phonetic: "/kəˈrɪkjələm/",
    zh: "课程；课程设置",
    en: "the subjects that are included in a course of study or taught in a school, college, etc.",
    examples: [
      "Foreign languages are part of the school curriculum.",
      "The university has updated its curriculum to include more practical skills."
    ],
    level: "B2"
  },
  {
    id: 103,
    word: "deadline",
    pos: "noun",
    phonetic: "/ˈdedlaɪn/",
    zh: "截止日期",
    en: "a point in time by which something must be done",
    examples: [
      "The deadline for applications is the end of the month.",
      "We are working hard to meet the deadline."
    ],
    level: "B2"
  },
  {
    id: 104,
    word: "debate",
    pos: "noun",
    phonetic: "/dɪˈbeɪt/",
    zh: "辩论；讨论",
    en: "a formal discussion of an issue at a public meeting or in a parliament",
    examples: [
      "There has been much debate about the new education policy.",
      "The candidates took part in a televised debate."
    ],
    level: "B2"
  },
  {
    id: 105,
    word: "debut",
    pos: "noun",
    phonetic: "/ˈdeɪbjuː/",
    zh: "首次亮相；处女作",
    en: "the first public appearance of a performer, sports player, etc.",
    examples: [
      "She made her debut on the London stage in 2018.",
      "His debut novel was a huge success."
    ],
    level: "B2"
  },
  {
    id: 106,
    word: "deceive",
    pos: "verb",
    phonetic: "/dɪˈsiːv/",
    zh: "欺骗；蒙蔽",
    en: "to make somebody believe something that is not true",
    examples: [
      "She had been deceived by his charming manner.",
      "Don't be deceived by appearances."
    ],
    level: "B2"
  },
  {
    id: 107,
    word: "decisive",
    pos: "adjective",
    phonetic: "/dɪˈsaɪsɪv/",
    zh: "决定性的；果断的",
    en: "very important for the final result of a particular situation; able to decide things quickly",
    examples: [
      "This was the decisive moment of the game.",
      "A good manager needs to be decisive."
    ],
    level: "B2"
  },
  {
    id: 108,
    word: "declaration",
    pos: "noun",
    phonetic: "/ˌdekləˈreɪʃn/",
    zh: "宣言；声明",
    en: "an official or formal statement, especially about the plans of a government or an organization",
    examples: [
      "The declaration of independence was signed in 1776.",
      "He made a declaration of his love for her."
    ],
    level: "B2"
  },
  {
    id: 109,
    word: "decline",
    pos: "verb",
    phonetic: "/dɪˈklaɪn/",
    zh: "下降；拒绝",
    en: "to become smaller, fewer, weaker, etc.; to refuse politely",
    examples: [
      "The number of tourists has declined significantly.",
      "She declined the invitation to dinner."
    ],
    level: "B2"
  },
  {
    id: 110,
    word: "dedicate",
    pos: "verb",
    phonetic: "/ˈdedɪkeɪt/",
    zh: "奉献；致力于",
    en: "to give a lot of your time and effort to a particular activity or purpose",
    examples: [
      "She dedicated her life to helping the poor.",
      "The book is dedicated to his mother."
    ],
    level: "B2"
  },
  {
    id: 111,
    word: "deficit",
    pos: "noun",
    phonetic: "/ˈdefɪsɪt/",
    zh: "赤字；亏损",
    en: "the amount by which money spent or owed is greater than money earned",
    examples: [
      "The government is trying to reduce the budget deficit.",
      "The company reported a deficit of ten million dollars."
    ],
    level: "B2"
  },
  {
    id: 112,
    word: "democracy",
    pos: "noun",
    phonetic: "/dɪˈmɒkrəsi/",
    zh: "民主；民主制度",
    en: "a system of government in which all the people of a country can vote to elect their representatives",
    examples: [
      "The country made the transition to democracy in the 1990s.",
      "Democracy depends on the participation of citizens."
    ],
    level: "B2"
  },
  {
    id: 113,
    word: "demographic",
    pos: "adjective",
    phonetic: "/ˌdeməˈɡræfɪk/",
    zh: "人口统计的",
    en: "relating to the study of changes in the number of births, deaths, diseases, etc. in a community",
    examples: [
      "Demographic changes are affecting the labour market.",
      "The company analysed the demographic data before launching the product."
    ],
    level: "B2"
  },
  {
    id: 114,
    word: "demonstrate",
    pos: "verb",
    phonetic: "/ˈdemənstreɪt/",
    zh: "证明；演示",
    en: "to show something clearly by giving proof or evidence; to show how something works",
    examples: [
      "The experiment demonstrates the effects of pollution on plant growth.",
      "She demonstrated how to use the new software."
    ],
    level: "B2"
  },
  {
    id: 115,
    word: "derive",
    pos: "verb",
    phonetic: "/dɪˈraɪv/",
    zh: "源于；获得",
    en: "to come or develop from something; to get something from something",
    examples: [
      "The word derives from Latin.",
      "He derives great pleasure from reading."
    ],
    level: "B2"
  },
  {
    id: 116,
    word: "despite",
    pos: "preposition",
    phonetic: "/dɪˈspaɪt/",
    zh: "尽管；虽然",
    en: "used to say that something happened or is true although something else might have prevented it",
    examples: [
      "Despite the rain, we enjoyed the trip.",
      "She got the job despite having no experience."
    ],
    level: "B2"
  },
  {
    id: 117,
    word: "detect",
    pos: "verb",
    phonetic: "/dɪˈtekt/",
    zh: "发现；侦测",
    en: "to discover or notice something, especially something that is not easy to see, hear, etc.",
    examples: [
      "The tests detected traces of poison in the blood.",
      "I detected a note of sadness in her voice."
    ],
    level: "B2"
  },
  {
    id: 118,
    word: "determination",
    pos: "noun",
    phonetic: "/dɪˌtɜːrmɪˈneɪʃn/",
    zh: "决心；毅力",
    en: "the quality that makes you continue trying to do something even when this is difficult",
    examples: [
      "She showed great determination in overcoming her disability.",
      "His determination to succeed impressed everyone."
    ],
    level: "B2"
  },
  {
    id: 119,
    word: "dialogue",
    pos: "noun",
    phonetic: "/ˈdaɪəlɒɡ/",
    zh: "对话；对白",
    en: "conversations in a book, play, or film; a formal discussion between two groups or countries",
    examples: [
      "The dialogue in the film was witty and natural.",
      "The two sides agreed to open a dialogue on trade issues."
    ],
    level: "B2"
  },
  {
    id: 120,
    word: "diminish",
    pos: "verb",
    phonetic: "/dɪˈmɪnɪʃ/",
    zh: "减少；缩小",
    en: "to become or to make something become smaller, weaker, etc.",
    examples: [
      "The world's rainforests are diminishing at an alarming rate.",
      "Nothing could diminish her enthusiasm for the project."
    ],
    level: "B2"
  },
  {
    id: 121,
    word: "diplomatic",
    pos: "adjective",
    phonetic: "/ˌdɪpləˈmætɪk/",
    zh: "外交的；圆滑的",
    en: "connected with managing relations between countries; having skill in dealing with people",
    examples: [
      "The two countries restored diplomatic relations.",
      "She gave a diplomatic answer to avoid offending anyone."
    ],
    level: "B2"
  },
  {
    id: 122,
    word: "disability",
    pos: "noun",
    phonetic: "/ˌdɪsəˈbɪləti/",
    zh: "残疾；障碍",
    en: "a physical or mental condition that limits a person's movements, senses, or activities",
    examples: [
      "The building has been adapted for people with disabilities.",
      "Learning disabilities affect a significant number of children."
    ],
    level: "B2"
  },
  {
    id: 123,
    word: "discipline",
    pos: "noun",
    phonetic: "/ˈdɪsəplɪn/",
    zh: "纪律；学科",
    en: "the practice of training people to obey rules and orders; a particular area of knowledge or study",
    examples: [
      "The school has strict discipline.",
      "Psychology is a relatively new academic discipline."
    ],
    level: "B2"
  },
  {
    id: 124,
    word: "disclose",
    pos: "verb",
    phonetic: "/dɪsˈkləʊz/",
    zh: "揭露；公开",
    en: "to give somebody information about something, especially something that was previously secret",
    examples: [
      "The company refused to disclose details of the agreement.",
      "He disclosed that he had been in prison."
    ],
    level: "B2"
  },
  {
    id: 125,
    word: "discrimination",
    pos: "noun",
    phonetic: "/dɪˌskrɪmɪˈneɪʃn/",
    zh: "歧视；辨别",
    en: "the practice of treating somebody or a particular group of people less fairly than other people",
    examples: [
      "Racial discrimination is against the law.",
      "The company has a policy against gender discrimination."
    ],
    level: "B2"
  },
  {
    id: 126,
    word: "dismiss",
    pos: "verb",
    phonetic: "/dɪsˈmɪs/",
    zh: "解雇；驳回",
    en: "to decide that somebody/something is not important and not worth thinking about; to remove somebody from their job",
    examples: [
      "He dismissed the idea as impractical.",
      "She was dismissed from her position without warning."
    ],
    level: "B2"
  },
  {
    id: 127,
    word: "disorder",
    pos: "noun",
    phonetic: "/dɪsˈɔːrdər/",
    zh: "混乱；失调",
    en: "an untidy state; a lack of order; an illness that causes a part of the body to stop functioning correctly",
    examples: [
      "The room was in complete disorder.",
      "She suffers from an eating disorder."
    ],
    level: "B2"
  },
  {
    id: 128,
    word: "displace",
    pos: "verb",
    phonetic: "/dɪsˈpleɪs/",
    zh: "取代；使流离失所",
    en: "to take the place of somebody/something; to force people to leave their home",
    examples: [
      "Computers have displaced typewriters in most offices.",
      "Thousands of people were displaced by the flooding."
    ],
    level: "B2"
  },
  {
    id: 129,
    word: "disposal",
    pos: "noun",
    phonetic: "/dɪˈspəʊzl/",
    zh: "处理；处置",
    en: "the act of getting rid of something; the fact of having something available to use",
    examples: [
      "The safe disposal of nuclear waste is a major concern.",
      "I have a car at my disposal."
    ],
    level: "B2"
  },
  {
    id: 130,
    word: "dispute",
    pos: "noun",
    phonetic: "/dɪˈspjuːt/",
    zh: "争端；纠纷",
    en: "an argument or a disagreement between two people, groups, or countries",
    examples: [
      "The workers are in dispute with management over pay.",
      "The border dispute has lasted for decades."
    ],
    level: "B2"
  },
  {
    id: 131,
    word: "distinction",
    pos: "noun",
    phonetic: "/dɪˈstɪŋkʃn/",
    zh: "区别；卓越",
    en: "a clear difference or contrast between people or things",
    examples: [
      "We need to make a distinction between the two concepts.",
      "She graduated with distinction from the university."
    ],
    level: "B2"
  },
  {
    id: 132,
    word: "distort",
    pos: "verb",
    phonetic: "/dɪˈstɔːrt/",
    zh: "扭曲；歪曲",
    en: "to change the shape, appearance, or sound of something so that it is strange or not clear; to report something in a way that is not accurate",
    examples: [
      "The mirror distorted her reflection.",
      "The media distorted the facts to create a sensational story."
    ],
    level: "B2"
  },
  {
    id: 133,
    word: "divert",
    pos: "verb",
    phonetic: "/daɪˈvɜːrt/",
    zh: "转移；使转向",
    en: "to make somebody/something change direction; to take somebody's attention away from something",
    examples: [
      "Traffic was diverted to avoid the accident.",
      "He tried to divert attention from his own mistakes."
    ],
    level: "B2"
  },
  {
    id: 134,
    word: "doctrine",
    pos: "noun",
    phonetic: "/ˈdɒktrɪn/",
    zh: "教义；学说",
    en: "a belief or set of beliefs held and taught by a church, a political party, or another group",
    examples: [
      "The party's doctrine emphasizes individual freedom.",
      "Christian doctrine teaches the importance of forgiveness."
    ],
    level: "B2"
  },
  {
    id: 135,
    word: "domain",
    pos: "noun",
    phonetic: "/dəˈmeɪn/",
    zh: "领域；范围",
    en: "an area of knowledge or activity; an area of land owned or controlled by a particular person",
    examples: [
      "Artificial intelligence is a rapidly growing domain.",
      "This problem falls within the domain of public health."
    ],
    level: "B2"
  },
  {
    id: 136,
    word: "dominant",
    pos: "adjective",
    phonetic: "/ˈdɒmɪnənt/",
    zh: "占主导地位的；显性的",
    en: "more important, powerful, or noticeable than other things",
    examples: [
      "The company has achieved a dominant position in the market.",
      "English has become the dominant language of international business."
    ],
    level: "B2"
  },
  {
    id: 137,
    word: "donation",
    pos: "noun",
    phonetic: "/dəʊˈneɪʃn/",
    zh: "捐赠；捐款",
    en: "something that is given to a person or an organization such as a charity, in order to help them",
    examples: [
      "The charity relies on donations from the public.",
      "She made a generous donation to the hospital."
    ],
    level: "B2"
  },
  {
    id: 138,
    word: "draft",
    pos: "noun",
    phonetic: "/drɑːft/",
    zh: "草稿；草案",
    en: "a rough written version of something that is not yet in its final form",
    examples: [
      "She showed me the first draft of her essay.",
      "The committee prepared a draft of the new regulations."
    ],
    level: "B2"
  },
  {
    id: 139,
    word: "dramatic",
    pos: "adjective",
    phonetic: "/drəˈmætɪk/",
    zh: "戏剧性的；引人注目的",
    en: "sudden, very great, and often surprising; connected with the theatre or plays",
    examples: [
      "There has been a dramatic increase in fuel prices.",
      "The sunset over the mountains was quite dramatic."
    ],
    level: "B2"
  },
  {
    id: 140,
    word: "duration",
    pos: "noun",
    phonetic: "/djʊˈreɪʃn/",
    zh: "持续时间",
    en: "the length of time that something lasts or continues",
    examples: [
      "The duration of the flight is approximately six hours.",
      "For the duration of the repairs, the road will be closed."
    ],
    level: "B2"
  },
  {
    id: 141,
    word: "echo",
    pos: "noun",
    phonetic: "/ˈekəʊ/",
    zh: "回声；共鸣",
    en: "the reflecting of sound off a wall or inside an enclosed space so that it is heard again",
    examples: [
      "She could hear the echo of her footsteps in the empty hall.",
      "His words found an echo in the hearts of many people."
    ],
    level: "B2"
  },
  {
    id: 142,
    word: "elaborate",
    pos: "adjective",
    phonetic: "/ɪˈlæbərət/",
    zh: "精心制作的；详尽的",
    en: "very detailed and complicated; carefully prepared and organized",
    examples: [
      "She wore an elaborate costume for the party.",
      "He came up with an elaborate plan to surprise her."
    ],
    level: "B2"
  },
  {
    id: 143,
    word: "eligible",
    pos: "adjective",
    phonetic: "/ˈelɪdʒəbl/",
    zh: "有资格的；合格的",
    en: "having the right qualifications or being in the right condition for something",
    examples: [
      "Only students over 18 are eligible to vote.",
      "She is eligible for a scholarship."
    ],
    level: "B2"
  },
  {
    id: 144,
    word: "eliminate",
    pos: "verb",
    phonetic: "/ɪˈlɪmɪneɪt/",
    zh: "消除；淘汰",
    en: "to remove or get rid of something completely",
    examples: [
      "We need to eliminate all sources of infection.",
      "Our team was eliminated in the first round of the competition."
    ],
    level: "B2"
  },
  {
    id: 145,
    word: "embrace",
    pos: "verb",
    phonetic: "/ɪmˈbreɪs/",
    zh: "拥抱；欣然接受",
    en: "to put your arms around somebody as a sign of love or friendship; to accept something enthusiastically",
    examples: [
      "They embraced each other warmly at the airport.",
      "The company has embraced new technology."
    ],
    level: "B2"
  },
  {
    id: 146,
    word: "emerge",
    pos: "verb",
    phonetic: "/ɪˈmɜːrdʒ/",
    zh: "出现；浮现",
    en: "to come out of a dark, confined, or hidden place; to start to exist or become known",
    examples: [
      "The sun emerged from behind the clouds.",
      "New evidence has emerged in the case."
    ],
    level: "B2"
  },
  {
    id: 147,
    word: "emission",
    pos: "noun",
    phonetic: "/ɪˈmɪʃn/",
    zh: "排放；排放物",
    en: "the production or sending out of light, heat, gas, etc.",
    examples: [
      "Carbon emissions from cars contribute to global warming.",
      "The factory must reduce its emissions by 50%."
    ],
    level: "B2"
  },
  {
    id: 148,
    word: "emphasis",
    pos: "noun",
    phonetic: "/ˈemfəsɪs/",
    zh: "强调；重点",
    en: "special importance that is given to something; extra force given to a word or phrase when speaking",
    examples: [
      "The school places great emphasis on academic achievement.",
      "He put special emphasis on the need for safety."
    ],
    level: "B2"
  },
  {
    id: 149,
    word: "encounter",
    pos: "verb",
    phonetic: "/ɪnˈkaʊntər/",
    zh: "遇到；遭遇",
    en: "to experience something, especially something unpleasant or difficult; to meet somebody unexpectedly",
    examples: [
      "We encountered several problems during the trip.",
      "I first encountered his work at university."
    ],
    level: "B2"
  },
  {
    id: 150,
    word: "endure",
    pos: "verb",
    phonetic: "/ɪnˈdjʊər/",
    zh: "忍受；持续",
    en: "to experience and deal with something that is painful or unpleasant without giving up",
    examples: [
      "She endured years of pain before seeking help.",
      "The friendship endured for over thirty years."
    ],
    level: "B2"
  },
  {
    id: 151,
    word: "enforce",
    pos: "verb",
    phonetic: "/ɪnˈfɔːrs/",
    zh: "执行；强制实施",
    en: "to make sure that people obey a particular law or rule",
    examples: [
      "The police are responsible for enforcing the law.",
      "The new regulations will be strictly enforced."
    ],
    level: "B2"
  },
  {
    id: 152,
    word: "engagement",
    pos: "noun",
    phonetic: "/ɪnˈɡeɪdʒmənt/",
    zh: "订婚；参与",
    en: "an agreement to marry; the act of being involved with something",
    examples: [
      "They announced their engagement last month.",
      "Student engagement is key to effective learning."
    ],
    level: "B2"
  },
  {
    id: 153,
    word: "enhance",
    pos: "verb",
    phonetic: "/ɪnˈhɑːns/",
    zh: "增强；提高",
    en: "to increase or further improve the good quality, value, or status of something",
    examples: [
      "The new lighting enhances the beauty of the building.",
      "Technology can enhance the learning experience."
    ],
    level: "B2"
  },
  {
    id: 154,
    word: "enterprise",
    pos: "noun",
    phonetic: "/ˈentərpraɪz/",
    zh: "企业；事业",
    en: "a company or business; a large project, especially one that is difficult",
    examples: [
      "The government supports small and medium enterprises.",
      "Building the bridge was a massive engineering enterprise."
    ],
    level: "B2"
  },
  {
    id: 155,
    word: "entity",
    pos: "noun",
    phonetic: "/ˈentəti/",
    zh: "实体；存在",
    en: "something that exists separately from other things and has its own identity",
    examples: [
      "The company was set up as a separate legal entity.",
      "The island became an independent political entity."
    ],
    level: "B2"
  },
  {
    id: 156,
    word: "entrepreneur",
    pos: "noun",
    phonetic: "/ˌɒntrəprəˈnɜːr/",
    zh: "企业家；创业者",
    en: "a person who makes money by starting or running businesses, especially when this involves taking financial risks",
    examples: [
      "She became a successful entrepreneur at the age of 25.",
      "The programme encourages young entrepreneurs to start their own businesses."
    ],
    level: "B2"
  },
  {
    id: 157,
    word: "epidemic",
    pos: "noun",
    phonetic: "/ˌepɪˈdemɪk/",
    zh: "流行病；蔓延",
    en: "a large number of cases of a particular disease happening at the same time in a particular community",
    examples: [
      "The flu epidemic affected thousands of people.",
      "Obesity has reached epidemic proportions in some countries."
    ],
    level: "B2"
  },
  {
    id: 158,
    word: "erosion",
    pos: "noun",
    phonetic: "/ɪˈrəʊʒn/",
    zh: "侵蚀；腐蚀",
    en: "the process by which the surface of something is gradually destroyed by the action of wind, rain, etc.",
    examples: [
      "Soil erosion has become a serious environmental problem.",
      "The erosion of civil liberties concerns many citizens."
    ],
    level: "B2"
  },
  {
    id: 159,
    word: "essence",
    pos: "noun",
    phonetic: "/ˈesns/",
    zh: "本质；精华",
    en: "the most important quality or feature of something that makes it what it is",
    examples: [
      "The essence of his argument is that we need more funding.",
      "Time is of the essence in this matter."
    ],
    level: "B2"
  },
  {
    id: 160,
    word: "ethnic",
    pos: "adjective",
    phonetic: "/ˈeθnɪk/",
    zh: "民族的；种族的",
    en: "connected with or belonging to a nation, race, or people that shares a cultural tradition",
    examples: [
      "The city has a rich ethnic diversity.",
      "Ethnic minorities often face discrimination."
    ],
    level: "B2"
  },
  {
    id: 161,
    word: "evaluate",
    pos: "verb",
    phonetic: "/ɪˈvæljueɪt/",
    zh: "评估；评价",
    en: "to form an opinion of the amount, value, or quality of something after thinking about it carefully",
    examples: [
      "We need to evaluate the results of the experiment.",
      "Teachers evaluate student progress throughout the year."
    ],
    level: "B2"
  },
  {
    id: 162,
    word: "evolution",
    pos: "noun",
    phonetic: "/ˌiːvəˈluːʃn/",
    zh: "进化；演变",
    en: "the slow steady development of something; the process by which organisms develop over time",
    examples: [
      "Darwin's theory of evolution changed scientific thinking.",
      "The evolution of technology has transformed modern life."
    ],
    level: "B2"
  },
  {
    id: 163,
    word: "exaggerate",
    pos: "verb",
    phonetic: "/ɪɡˈzædʒəreɪt/",
    zh: "夸大；夸张",
    en: "to make something seem larger, better, worse, or more important than it really is",
    examples: [
      "He tends to exaggerate the dangers of the situation.",
      "The importance of this discovery cannot be exaggerated."
    ],
    level: "B2"
  },
  {
    id: 164,
    word: "exceed",
    pos: "verb",
    phonetic: "/ɪkˈsiːd/",
    zh: "超过；超越",
    en: "to be greater than a particular number or amount; to do more than the law or rules allow",
    examples: [
      "The cost must not exceed fifty thousand dollars.",
      "The results exceeded our expectations."
    ],
    level: "B2"
  },
  {
    id: 165,
    word: "exclusively",
    pos: "adverb",
    phonetic: "/ɪkˈskluːsɪvli/",
    zh: "专门地；排他地",
    en: "only; for one particular person, group, or purpose and no others",
    examples: [
      "The club is exclusively for members.",
      "She works almost exclusively from home."
    ],
    level: "B2"
  },
  {
    id: 166,
    word: "exploit",
    pos: "verb",
    phonetic: "/ɪkˈsplɔɪt/",
    zh: "利用；剥削",
    en: "to use something well in order to gain as much from it as possible; to treat somebody unfairly",
    examples: [
      "We must exploit every opportunity that comes our way.",
      "Workers were being exploited by their employers."
    ],
    level: "B2"
  },
  {
    id: 167,
    word: "exposure",
    pos: "noun",
    phonetic: "/ɪkˈspəʊʒər/",
    zh: "暴露；接触",
    en: "the state of being in a place or situation where there is no protection; experience of something",
    examples: [
      "Prolonged exposure to the sun can cause skin cancer.",
      "The trip gave her exposure to different cultures."
    ],
    level: "B2"
  },
  {
    id: 168,
    word: "extensive",
    pos: "adjective",
    phonetic: "/ɪkˈstensɪv/",
    zh: "广泛的；大量的",
    en: "covering a large area; having a great range; large in amount or scale",
    examples: [
      "The house has extensive gardens.",
      "Extensive research has been carried out on this topic."
    ],
    level: "B2"
  },
  {
    id: 169,
    word: "extract",
    pos: "verb",
    phonetic: "/ɪkˈstrækt/",
    zh: "提取；摘录",
    en: "to remove or obtain a substance from something, for example by using an industrial or chemical process",
    examples: [
      "Oil is extracted from beneath the seabed.",
      "The dentist had to extract two of her teeth."
    ],
    level: "B2"
  },
  {
    id: 170,
    word: "fabric",
    pos: "noun",
    phonetic: "/ˈfæbrɪk/",
    zh: "织物；结构",
    en: "material made by weaving wool, cotton, etc.; the basic structure of something",
    examples: [
      "The dress is made from a lightweight cotton fabric.",
      "Drugs threaten the very fabric of society."
    ],
    level: "B2"
  },
  {
    id: 171,
    word: "facilitate",
    pos: "verb",
    phonetic: "/fəˈsɪlɪteɪt/",
    zh: "促进；使便利",
    en: "to make an action or a process possible or easier",
    examples: [
      "The new software facilitates communication between departments.",
      "Her role is to facilitate discussion among team members."
    ],
    level: "B2"
  },
  {
    id: 172,
    word: "fatal",
    pos: "adjective",
    phonetic: "/ˈfeɪtl/",
    zh: "致命的；灾难性的",
    en: "causing or ending in death; having very harmful results",
    examples: [
      "The accident proved fatal for the driver.",
      "Making that investment was a fatal mistake."
    ],
    level: "B2"
  },
  {
    id: 173,
    word: "fierce",
    pos: "adjective",
    phonetic: "/fɪrs/",
    zh: "猛烈的；激烈的",
    en: "angry and aggressive in a way that is frightening; very strong or intense",
    examples: [
      "There is fierce competition for places at the university.",
      "The fierce wind knocked down several trees."
    ],
    level: "B2"
  },
  {
    id: 174,
    word: "flourish",
    pos: "verb",
    phonetic: "/ˈflʌrɪʃ/",
    zh: "繁荣；茂盛",
    en: "to develop quickly and be successful or common; to grow well",
    examples: [
      "The arts flourished during the Renaissance.",
      "Plants flourish in the warm, damp conditions."
    ],
    level: "B2"
  },
  {
    id: 175,
    word: "fluctuate",
    pos: "verb",
    phonetic: "/ˈflʌktʃueɪt/",
    zh: "波动；起伏",
    en: "to change frequently in size, amount, quality, etc., especially from one extreme to another",
    examples: [
      "Prices fluctuate according to demand.",
      "Her mood fluctuated between hope and despair."
    ],
    level: "B2"
  },
  {
    id: 176,
    word: "forecast",
    pos: "noun",
    phonetic: "/ˈfɔːrkɑːst/",
    zh: "预测；预报",
    en: "a statement about what will happen in the future, based on information that is available now",
    examples: [
      "The weather forecast predicts rain for tomorrow.",
      "Economic forecasts suggest a period of slow growth."
    ],
    level: "B2"
  },
  {
    id: 177,
    word: "forge",
    pos: "verb",
    phonetic: "/fɔːrdʒ/",
    zh: "锻造；伪造",
    en: "to make or produce something, especially with difficulty; to produce a copy of something illegally",
    examples: [
      "The two countries forged a strong alliance.",
      "He was arrested for forging documents."
    ],
    level: "B2"
  },
  {
    id: 178,
    word: "formulate",
    pos: "verb",
    phonetic: "/ˈfɔːrmjuleɪt/",
    zh: "制定；构想",
    en: "to create or prepare something carefully, giving particular attention to the details",
    examples: [
      "The government is formulating a new policy on immigration.",
      "It took time to formulate a response to the crisis."
    ],
    level: "B2"
  },
  {
    id: 179,
    word: "fossil",
    pos: "noun",
    phonetic: "/ˈfɒsl/",
    zh: "化石",
    en: "the remains of an animal or a plant that have become hard and turned into rock",
    examples: [
      "Fossils of dinosaurs have been found on every continent.",
      "Fossil fuels such as coal and oil are non-renewable resources."
    ],
    level: "B2"
  },
  {
    id: 180,
    word: "fraction",
    pos: "noun",
    phonetic: "/ˈfrækʃn/",
    zh: "分数；小部分",
    en: "a small part or amount of something; a number that is not a whole number",
    examples: [
      "Only a small fraction of the population voted.",
      "She hesitated for a fraction of a second before answering."
    ],
    level: "B2"
  },
  {
    id: 181,
    word: "fragment",
    pos: "noun",
    phonetic: "/ˈfræɡmənt/",
    zh: "碎片；片段",
    en: "a small part of something that has broken off or that comes from something larger",
    examples: [
      "Fragments of glass were scattered across the floor.",
      "I only heard fragments of their conversation."
    ],
    level: "B2"
  },
  {
    id: 182,
    word: "framework",
    pos: "noun",
    phonetic: "/ˈfreɪmwɜːrk/",
    zh: "框架；体系",
    en: "a set of beliefs, ideas, or rules that is used as the basis for making judgements or decisions",
    examples: [
      "The report provides a framework for future research.",
      "We need to establish a legal framework for online commerce."
    ],
    level: "B2"
  },
  {
    id: 183,
    word: "frustration",
    pos: "noun",
    phonetic: "/frʌˈstreɪʃn/",
    zh: "挫折；沮丧",
    en: "the feeling of being annoyed or less confident because you cannot achieve what you want",
    examples: [
      "He expressed his frustration at the lack of progress.",
      "The delays caused widespread frustration among passengers."
    ],
    level: "B2"
  },
  {
    id: 184,
    word: "fulfil",
    pos: "verb",
    phonetic: "/fʊlˈfɪl/",
    zh: "实现；履行",
    en: "to do or achieve what was hoped for or expected; to carry out a duty or promise",
    examples: [
      "She finally fulfilled her dream of becoming a doctor.",
      "The company failed to fulfil its contractual obligations."
    ],
    level: "B2"
  },
  {
    id: 185,
    word: "fundamental",
    pos: "adjective",
    phonetic: "/ˌfʌndəˈmentl/",
    zh: "基本的；根本的",
    en: "serious and very important; affecting the most central and important parts of something",
    examples: [
      "There is a fundamental difference between the two approaches.",
      "Clean water is a fundamental human right."
    ],
    level: "B2"
  },
  {
    id: 186,
    word: "genuine",
    pos: "adjective",
    phonetic: "/ˈdʒenjuɪn/",
    zh: "真正的；真诚的",
    en: "real; exactly what it appears to be; sincere and honest",
    examples: [
      "Is the painting a genuine Rembrandt?",
      "She showed genuine concern for his well-being."
    ],
    level: "B2"
  },
  {
    id: 187,
    word: "gesture",
    pos: "noun",
    phonetic: "/ˈdʒestʃər/",
    zh: "手势；姿态",
    en: "a movement of part of the body, especially a hand or the head, to express an idea or meaning",
    examples: [
      "He made a rude gesture at the other driver.",
      "Sending flowers was a kind gesture."
    ],
    level: "B2"
  },
  {
    id: 188,
    word: "grasp",
    pos: "verb",
    phonetic: "/ɡrɑːsp/",
    zh: "抓住；理解",
    en: "to take firm hold of something; to understand something completely",
    examples: [
      "She grasped his hand tightly.",
      "He failed to grasp the significance of the discovery."
    ],
    level: "B2"
  },
  {
    id: 189,
    word: "guidance",
    pos: "noun",
    phonetic: "/ˈɡaɪdns/",
    zh: "指导；引导",
    en: "help and advice about how to do something or about how to deal with problems",
    examples: [
      "Children need guidance from their parents.",
      "The teacher provided guidance on how to write the essay."
    ],
    level: "B2"
  },
  {
    id: 190,
    word: "harsh",
    pos: "adjective",
    phonetic: "/hɑːrʃ/",
    zh: "严厉的；恶劣的",
    en: "cruel, severe, and unkind; unpleasant and difficult to live in",
    examples: [
      "The judge imposed a harsh sentence.",
      "The harsh winter weather made travelling difficult."
    ],
    level: "B2"
  },
  {
    id: 191,
    word: "heritage",
    pos: "noun",
    phonetic: "/ˈherɪtɪdʒ/",
    zh: "遗产；传统",
    en: "the history, traditions, and qualities that a country or society has had for many years",
    examples: [
      "The city is proud of its cultural heritage.",
      "These buildings are part of our national heritage."
    ],
    level: "B2"
  },
  {
    id: 192,
    word: "hierarchy",
    pos: "noun",
    phonetic: "/ˈhaɪərɑːrki/",
    zh: "等级制度；层级",
    en: "a system in which people or things are arranged according to their importance",
    examples: [
      "There is a strict hierarchy within the organization.",
      "He quickly rose through the corporate hierarchy."
    ],
    level: "B2"
  },
  {
    id: 193,
    word: "humanitarian",
    pos: "adjective",
    phonetic: "/hjuːˌmænɪˈteəriən/",
    zh: "人道主义的",
    en: "concerned with reducing suffering and improving the conditions that people live in",
    examples: [
      "The organization provides humanitarian aid to refugees.",
      "The country is facing a humanitarian crisis."
    ],
    level: "B2"
  },
  {
    id: 194,
    word: "hypothesis",
    pos: "noun",
    phonetic: "/haɪˈpɒθəsɪs/",
    zh: "假说；假设",
    en: "an idea or explanation of something that is based on a few known facts but that has not yet been proved to be true",
    examples: [
      "The scientist put forward a hypothesis to explain the results.",
      "We need to test this hypothesis with further experiments."
    ],
    level: "B2"
  },
  {
    id: 195,
    word: "ideology",
    pos: "noun",
    phonetic: "/ˌaɪdiˈɒlədʒi/",
    zh: "意识形态；思想体系",
    en: "a set of beliefs, especially one held by a particular group, that influences the way people behave",
    examples: [
      "Political ideology shapes government policy.",
      "The two countries are divided by ideology."
    ],
    level: "B2"
  },
  {
    id: 196,
    word: "ignorance",
    pos: "noun",
    phonetic: "/ˈɪɡnərəns/",
    zh: "无知；愚昧",
    en: "a lack of knowledge or information about something",
    examples: [
      "His ignorance of the law is no excuse.",
      "Public ignorance about the disease needs to be addressed."
    ],
    level: "B2"
  },
  {
    id: 197,
    word: "illustrate",
    pos: "verb",
    phonetic: "/ˈɪləstreɪt/",
    zh: "说明；图解",
    en: "to make the meaning of something clearer by using examples, pictures, etc.",
    examples: [
      "The report illustrates the need for more investment.",
      "The book is beautifully illustrated with colour photographs."
    ],
    level: "B2"
  },
  {
    id: 198,
    word: "immense",
    pos: "adjective",
    phonetic: "/ɪˈmens/",
    zh: "巨大的；无限的",
    en: "extremely large or great",
    examples: [
      "The task requires an immense amount of patience.",
      "She felt immense relief when the results were announced."
    ],
    level: "B2"
  },
  {
    id: 199,
    word: "imperial",
    pos: "adjective",
    phonetic: "/ɪmˈpɪəriəl/",
    zh: "帝国的；皇帝的",
    en: "connected with an empire; connected with the system for measuring length, weight, etc. using pounds, inches, etc.",
    examples: [
      "The imperial palace was built in the 15th century.",
      "Britain converted from the imperial system to the metric system."
    ],
    level: "B2"
  },
  {
    id: 200,
    word: "implement",
    pos: "verb",
    phonetic: "/ˈɪmplɪment/",
    zh: "实施；执行",
    en: "to make something that has been officially decided start to happen or be used",
    examples: [
      "The government has failed to implement the reforms.",
      "The new system will be implemented next year."
    ],
    level: "B2"
  }
];
