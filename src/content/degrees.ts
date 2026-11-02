import type { Project } from "./projects";

// From Eduardo's diplomas (~/Documents/cv). Subjects only: no grades, no personal identity details.
export const DEGREES: Project[] = [
  {
    slug: "bsc-computer-science",
    title: "BSc Computer Science",
    stage: "braga",
    order: 0,
    stageLabel: "Braga · Universidade do Minho",
    subtitle: "Licenciatura in Computer Science at Universidade do Minho, 2017–2022.",
    tags: ["Universidade do Minho", "Bachelor's degree", "2017–2022"],
    logo: { src: "/degrees/uminho-symbol.png", alt: "University of Minho" },
    sections: [
      {
        heading: "The degree",
        body:
          "A licenciatura (bachelor's degree) in Computer Science at Universidade do Minho in Braga, completed in July 2022. " +
          "It builds from mathematics and logic through programming in several paradigms (functional, imperative, " +
          "object-oriented and concurrent) to algorithms and complexity, systems and networks, databases, compilers and " +
          "the semantics of programming languages, ending with a final project.",
      },
    ],
    lists: [
      {
        heading: "2017/2018",
        items: [
          "Linear Algebra",
          "Topics of Mathematics",
          "Computing with R",
          "Analysis",
          "Geometry",
          "Discrete Mathematics",
          "Algorithmic Problem Solving Lab I",
        ],
      },
      {
        heading: "2018/2019",
        items: [
          "Functional Programming",
          "Computer Systems",
          "Imperative Programming",
          "Logic",
          "Numerical Analysis",
          "Communications Systems and Networks",
          "Algorithmic Problem Solving Lab II",
          "Automata and Formal Languages",
        ],
      },
      {
        heading: "2019/2020",
        items: [
          "Calculus",
          "Algorithms and Complexity",
          "Program Calculation",
          "Object Oriented Programming",
          "Operating Systems",
          "Databases",
          "Computer Graphics",
        ],
      },
      {
        heading: "2020/2021",
        items: [
          "Algebra",
          "Computability and Complexity",
          "Computational Logic",
          "Probabilities and Applications",
          "Compilers and Language Processing",
          "Computational Number Theory",
          "Concurrent Programming",
          "Concurrency and Interaction",
          "Semantics of Programming Languages",
          "Project",
        ],
      },
      { heading: "2021/2022", items: ["Universal Algebra and Categories"] },
    ],
  },
  {
    slug: "msc-ai-engineering",
    title: "MSc AI Engineering",
    stage: "jonkoping",
    order: 0,
    stageLabel: "Jönköping · Jönköping University",
    subtitle: "Master of Science (120 credits) in Computer Science, specialising in AI Engineering, 2024–2026.",
    tags: ["Jönköping University", "120 ECTS", "2024–2026"],
    sections: [
      {
        heading: "The degree",
        body:
          "A two-year Degree of Master of Science (120 credits) with a major in Computer Science and a specialisation in " +
          "Artificial Intelligence (AI) Engineering, at Jönköping University's School of Engineering. Taught in English " +
          "and completed in June 2026, including an industrial placement course.",
      },
      {
        heading: "Degree project",
        body: "AI Driven Sensor Optimization For Marksman Posture Analysis (30 credits).",
      },
    ],
    lists: [
      {
        heading: "Courses",
        items: [
          "Mathematics for Intelligent Systems",
          "Artificial Intelligence",
          "Data Science",
          "Knowledge Representation and the Semantic Web",
          "Ethics of Artificial Intelligence",
          "Machine Learning",
          "Deep Learning",
          "Data Science Programming",
          "Reinforcement Learning",
          "Research Methods for Intelligent Systems",
          "State-of-the-Art in AI Research",
          "Industrial Placement Course in Computer Science",
        ],
      },
      { heading: "Degree project", items: ["Final Project Work in Computer Science"] },
    ],
  },
];
