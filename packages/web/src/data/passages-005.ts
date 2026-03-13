import type { Passage } from '@/types'

export const passages: Passage[] = [
  {
    id: 116,
    title: "How a Screen Draws a Picture",
    genre: "explainer",
    text: "When you open a web page, your computer does a lot of work behind the scenes. The rendering engine reads the code and turns it into what you see on screen. First, it builds a tree of all the elements on the page. Then it works out where each element should go and how big it should be. This is a fundamental step because even a small mistake can make the whole page look wrong. Next, the engine paints the colours and shapes onto the screen. Each component of the page goes through this process in a linear order. Modern engines are sophisticated enough to skip parts that have not changed. Understanding this mechanism helps developers write faster, smoother websites. Although users rarely think about it, the output they see is the result of many careful steps working together.",
    wordIds: [185, 580, 257, 415, 272, 327],
    level: "B1",
    topic: "technology",

  },
  {
    id: 117,
    title: "Tracking Down a Rendering Bug",
    genre: "story",
    text: "Last week, I noticed that a button on our app was not showing in the right place. It only happened on certain screen sizes, which made it hard to detect. I started by checking the recent code changes to trace the problem. After an hour of reading through files, I found that a small update had triggered the layout to break. The underlying cause was a missing value in the style rules. It was a minor issue, but it had a significant effect on how the page looked. I felt some frustration at first, but staying patient helped me think clearly. Once I fixed the code, I tested it thoroughly on different devices. The bug was gone. My colleague said she had overlooked the same problem earlier. It reminded me that even small details can have a tremendous impact on quality.",
    wordIds: [117, 474, 480, 485, 281, 410, 183, 58, 331, 479],
    level: "B1",
    topic: "technology",

  },
  {
    id: 118,
    title: "Learning from a Code Review",
    genre: "essay",
    text: "Code review is a common practice in software teams. When a developer finishes a piece of work, a colleague looks at the code before it goes live. The goal is to assess the quality and find anything that might cause problems later. Good reviewers do not merely point out mistakes. They also explain why a certain approach is better. This helps the whole team improve steadily over time. It can feel awkward to have someone inspect your work, but most people learn to see it as a chance to grow. A thorough review often catches issues that testing alone would miss. It is important to convey your comments in a kind and clear way. When done well, code review builds trust and leads to more consistent output across the project.",
    wordIds: [29, 274, 58, 427, 223, 466, 94, 85, 327],
    level: "B1",
    topic: "work",

  },
  {
    id: 119,
    title: "A Productive Team Meeting",
    genre: "story",
    text: "Every Monday, our team holds a short meeting to talk about the week ahead. The lead engineer starts by giving an outline of the main tasks. Then each person shares what they are working on and any obstacles they face. Last Monday, two developers had different ideas about how to solve a rendering problem. One wanted to modify the existing code, while the other suggested writing it from scratch. The discussion was intense at times, but everyone listened carefully. In the end, the team reached a consensus and agreed to try the first approach. These meetings facilitate better communication and help us anticipate problems before they grow. I have noticed that when people feel heard, they become more productive and keen to contribute.",
    wordIds: [325, 314, 284, 232, 82, 171, 18, 375, 245],
    level: "B1",
    topic: "communication",

  },
  {
    id: 120,
    title: "Making the App Run Faster",
    genre: "explainer",
    text: "Performance is a crucial aspect of any application. If a page takes too long to load, users will leave. The first step is to evaluate where the slowness comes from. Developers use special tools to measure how long each part of the code takes to run. Sometimes the problem is that the app does too many things simultaneously. Other times, a single slow function can become an obstacle for the whole system. One common strategy is to minimize the amount of work the browser has to do on each frame. Another is to eliminate unnecessary calculations that happen again and again. Setting a clear benchmark helps the team track progress over time. Even a swift improvement of a few milliseconds can make the experience feel much smoother for the user.",
    wordIds: [101, 27, 161, 411, 314, 279, 144, 541, 455],
    level: "B1",
    topic: "technology",

  },
  {
    id: 121,
    title: "Racing Against the Deadline",
    genre: "story",
    text: "We had two weeks to finish the new feature, but halfway through, a major setback slowed us down. The design changed, and we had to redo a large part of the work. The strain on the team was obvious. Some people stayed late every night, and the atmosphere became tense. Our manager tried to allocate extra help, but it was hard to find people who understood the code. I felt a growing anxiety about whether we would finish on time. Nevertheless, we kept going and split the remaining tasks into smaller pieces. Each person was dedicated to one part and worked hard. On the last day, we submitted the feature just before the deadline. The outcome was not perfect, but it was good enough to launch. The experience taught me that patience and teamwork matter most under pressure.",
    wordIds: [403, 433, 461, 13, 19, 302, 420, 110, 439, 103, 324, 249, 338],
    level: "B1",
    topic: "work",

  },
  {
    id: 122,
    title: "Solving a Hard Problem Together",
    genre: "story",
    text: "Our rendering engine had a persistent bug that no one could fix alone. Images would flicker on screen whenever the user scrolled quickly. Three of us decided to collaborate and tackle the issue as a group. We started by listing every possible cause and then testing each assumption one by one. It took two full days of careful work. At one point, we discovered that the engine was trying to draw the same image twice in the same frame. The solution was to add a check that would prevent this from happening. It was a breakthrough moment for the team. Working alongside each other helped us grasp the problem from different angles. I learned that some obstacles are too complex for one person and that genuine teamwork, where people cooperate openly, can yield remarkable results.",
    wordIds: [343, 568, 458, 30, 43, 516, 188, 314, 186, 95, 497],
    level: "B1",
    topic: "work",

  },
  {
    id: 123,
    title: "Writing Clear Technical Documentation",
    genre: "essay",
    text: "Good documentation is just as important as good code. When a new developer joins the team, they need to grasp how the system works without asking too many questions. A comprehensive guide saves time and reduces confusion. The first step is to outline the main parts of the system and how they connect. Use simple language and avoid vague descriptions that could be interpreted in different ways. It helps to include examples that demonstrate how each feature behaves. Many teams neglect documentation because they are busy writing code. However, this tendency leads to problems when someone leaves or when the project grows. Keeping your documents up to date requires ongoing effort and discipline. A well-written guide can transform a confusing codebase into one that any competent developer can understand readily.",
    wordIds: [188, 73, 325, 492, 237, 114, 293, 460, 319, 476, 68, 393],
    level: "B1",
    topic: "communication",

  },
  {
    id: 124,
    title: "Cleaning Up Old Code",
    genre: "essay",
    text: "Refactoring means changing the structure of code without changing what it does. Over time, software projects accumulate layers of quick fixes that make the code harder to read. A developer may encounter functions that are too long or logic that is difficult to follow. The goal of refactoring is to make the code cleaner and easier to modify in the future. It is a fundamental practice that many teams overlook because the results are not immediately visible. However, neglecting it can trigger serious problems down the road. Before starting, it is important to have good tests so you can verify that nothing breaks. A rational approach is to refactor small sections at a time rather than rewriting everything at once. The subsequent code is usually simpler and more stable. Teams that dedicate time to refactoring find that new features become easier to implement.",
    wordIds: [149, 284, 185, 331, 293, 480, 392, 440, 110, 200],
    level: "B1",
    topic: "technology",

  },
  {
    id: 125,
    title: "Welcome to the Rendering Team",
    genre: "story",
    text: "Last month, a new developer named Li joined our rendering team. She had just finished university and was keen to learn. On her first day, we gave her a comprehensive overview of the project and its framework. She asked many thoughtful questions, which showed that she was eager to grasp the details. Her manager paired her with a senior colleague who would provide guidance during the first few weeks. Li found the codebase overwhelming at first, but she adapted quickly. By the end of her second week, she had already submitted her first code change. The team acknowledged her effort and gave her positive comments. Watching someone new integrate into the group reminded us all of how important it is to be patient and supportive. A welcoming atmosphere can transform a nervous newcomer into a dedicated team member.",
    wordIds: [245, 73, 182, 188, 58, 189, 333, 9, 439, 7, 229, 476, 110],
    level: "B1",
    topic: "relationships",

  }
]
