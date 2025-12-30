export interface SyllabusTopic {
  id: string;
  name: string;
  materials: {
    video?: { name: string; url: string; uploadedAt: Date };
    document?: { name: string; url: string; uploadedAt: Date };
  };
}

export interface SyllabusModule {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: SyllabusTopic[];
}

export interface CourseSyllabus {
  id: string;
  name: string;
  description: string;
  instructor: string;
  modules: SyllabusModule[];
}

export const coursesSyllabusData: CourseSyllabus[] = [
  {
    id: 'sql-databases',
    name: 'SQL & Databases',
    description: 'Comprehensive course covering database concepts, SQL queries, and database management',
    instructor: 'Dr. Sarah Johnson',
    modules: [
      {
        id: 'sql-m1',
        title: 'Module 1: Introduction to Databases & DBMS',
        level: 'Beginner',
        topics: [
          { id: 'sql-m1-t1', name: 'Database concepts', materials: {} },
          { id: 'sql-m1-t2', name: 'DBMS vs RDBMS', materials: {} },
          { id: 'sql-m1-t3', name: 'Data models', materials: {} },
        ],
      },
      {
        id: 'sql-m2',
        title: 'Module 2: Relational Model & SQL Basics',
        level: 'Beginner',
        topics: [
          { id: 'sql-m2-t1', name: 'Tables, keys, constraints', materials: {} },
          { id: 'sql-m2-t2', name: 'Basic SQL queries', materials: {} },
        ],
      },
      {
        id: 'sql-m3',
        title: 'Module 3: Data Definition & Manipulation',
        level: 'Beginner',
        topics: [
          { id: 'sql-m3-t1', name: 'CREATE, ALTER, DROP', materials: {} },
          { id: 'sql-m3-t2', name: 'INSERT, UPDATE, DELETE', materials: {} },
        ],
      },
      {
        id: 'sql-m4',
        title: 'Module 4: Functions & Operators',
        level: 'Beginner',
        topics: [
          { id: 'sql-m4-t1', name: 'Aggregate functions', materials: {} },
          { id: 'sql-m4-t2', name: 'String and date functions', materials: {} },
        ],
      },
      {
        id: 'sql-m5',
        title: 'Module 5: Joins & Subqueries',
        level: 'Intermediate',
        topics: [
          { id: 'sql-m5-t1', name: 'Inner, outer joins', materials: {} },
          { id: 'sql-m5-t2', name: 'Nested queries', materials: {} },
        ],
      },
      {
        id: 'sql-m6',
        title: 'Module 6: Views, Indexes & Sequences',
        level: 'Intermediate',
        topics: [
          { id: 'sql-m6-t1', name: 'View creation', materials: {} },
          { id: 'sql-m6-t2', name: 'Index optimization', materials: {} },
        ],
      },
      {
        id: 'sql-m7',
        title: 'Module 7: Normalization & Database Design',
        level: 'Intermediate',
        topics: [
          { id: 'sql-m7-t1', name: 'Normal forms', materials: {} },
          { id: 'sql-m7-t2', name: 'Schema design', materials: {} },
        ],
      },
      {
        id: 'sql-m8',
        title: 'Module 8: Transactions & Concurrency',
        level: 'Intermediate',
        topics: [
          { id: 'sql-m8-t1', name: 'ACID properties', materials: {} },
          { id: 'sql-m8-t2', name: 'Locks and isolation levels', materials: {} },
        ],
      },
      {
        id: 'sql-m9',
        title: 'Module 9: Stored Procedures & Triggers',
        level: 'Advanced',
        topics: [
          { id: 'sql-m9-t1', name: 'Procedures', materials: {} },
          { id: 'sql-m9-t2', name: 'Functions', materials: {} },
          { id: 'sql-m9-t3', name: 'Triggers', materials: {} },
        ],
      },
      {
        id: 'sql-m10',
        title: 'Module 10: Database Security',
        level: 'Advanced',
        topics: [
          { id: 'sql-m10-t1', name: 'User roles', materials: {} },
          { id: 'sql-m10-t2', name: 'Privileges', materials: {} },
          { id: 'sql-m10-t3', name: 'SQL injection prevention', materials: {} },
        ],
      },
      {
        id: 'sql-m11',
        title: 'Module 11: Performance Tuning',
        level: 'Advanced',
        topics: [
          { id: 'sql-m11-t1', name: 'Query optimization', materials: {} },
          { id: 'sql-m11-t2', name: 'Execution plans', materials: {} },
        ],
      },
      {
        id: 'sql-m12',
        title: 'Module 12: NoSQL Databases',
        level: 'Advanced',
        topics: [
          { id: 'sql-m12-t1', name: 'MongoDB basics', materials: {} },
          { id: 'sql-m12-t2', name: 'Document-based storage', materials: {} },
        ],
      },
      {
        id: 'sql-m13',
        title: 'Module 13: Database Integration',
        level: 'Advanced',
        topics: [
          { id: 'sql-m13-t1', name: 'JDBC overview', materials: {} },
          { id: 'sql-m13-t2', name: 'Application integration', materials: {} },
        ],
      },
      {
        id: 'sql-m14',
        title: 'Module 14: Case Studies & Placement Readiness',
        level: 'Advanced',
        topics: [
          { id: 'sql-m14-t1', name: 'Real-world database problems', materials: {} },
          { id: 'sql-m14-t2', name: 'Interview preparation', materials: {} },
        ],
      },
    ],
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    description: 'Master algorithmic thinking and problem-solving with comprehensive DSA coverage',
    instructor: 'Prof. Michael Chen',
    modules: [
      {
        id: 'dsa-m1',
        title: 'Module 1: Introduction to DSA & Programming Foundations',
        level: 'Beginner',
        topics: [
          { id: 'dsa-m1-t1', name: 'Problem-solving strategies', materials: {} },
          { id: 'dsa-m1-t2', name: 'Flowcharts and pseudocode', materials: {} },
          { id: 'dsa-m1-t3', name: 'Programming fundamentals', materials: {} },
        ],
      },
      {
        id: 'dsa-m2',
        title: 'Module 2: Complexity Analysis',
        level: 'Beginner',
        topics: [
          { id: 'dsa-m2-t1', name: 'Time and space complexity', materials: {} },
          { id: 'dsa-m2-t2', name: 'Big-O, Big-Ω, Big-Θ notations', materials: {} },
        ],
      },
      {
        id: 'dsa-m3',
        title: 'Module 3: Arrays & Strings',
        level: 'Beginner',
        topics: [
          { id: 'dsa-m3-t1', name: 'Traversal, insertion, deletion', materials: {} },
          { id: 'dsa-m3-t2', name: 'Sliding window techniques', materials: {} },
          { id: 'dsa-m3-t3', name: 'String manipulation', materials: {} },
        ],
      },
      {
        id: 'dsa-m4',
        title: 'Module 4: Recursion & Mathematical Foundations',
        level: 'Beginner',
        topics: [
          { id: 'dsa-m4-t1', name: 'Recursion principles', materials: {} },
          { id: 'dsa-m4-t2', name: 'Mathematical problem solving', materials: {} },
          { id: 'dsa-m4-t3', name: 'Recurrence relations', materials: {} },
        ],
      },
      {
        id: 'dsa-m5',
        title: 'Module 5: Searching & Sorting Algorithms',
        level: 'Intermediate',
        topics: [
          { id: 'dsa-m5-t1', name: 'Linear and Binary search', materials: {} },
          { id: 'dsa-m5-t2', name: 'Bubble, Selection, Insertion sort', materials: {} },
          { id: 'dsa-m5-t3', name: 'Merge sort, Quick sort', materials: {} },
        ],
      },
      {
        id: 'dsa-m6',
        title: 'Module 6: Linked Lists',
        level: 'Intermediate',
        topics: [
          { id: 'dsa-m6-t1', name: 'Singly, Doubly, Circular lists', materials: {} },
          { id: 'dsa-m6-t2', name: 'Operations and applications', materials: {} },
        ],
      },
      {
        id: 'dsa-m7',
        title: 'Module 7: Stacks & Queues',
        level: 'Intermediate',
        topics: [
          { id: 'dsa-m7-t1', name: 'Stack operations and applications', materials: {} },
          { id: 'dsa-m7-t2', name: 'Queues, circular queues, deque', materials: {} },
        ],
      },
      {
        id: 'dsa-m8',
        title: 'Module 8: Hashing & Hash Tables',
        level: 'Intermediate',
        topics: [
          { id: 'dsa-m8-t1', name: 'Hash functions', materials: {} },
          { id: 'dsa-m8-t2', name: 'Collision resolution techniques', materials: {} },
        ],
      },
      {
        id: 'dsa-m9',
        title: 'Module 9: Trees',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m9-t1', name: 'Binary trees', materials: {} },
          { id: 'dsa-m9-t2', name: 'Binary Search Trees', materials: {} },
          { id: 'dsa-m9-t3', name: 'Tree traversals', materials: {} },
        ],
      },
      {
        id: 'dsa-m10',
        title: 'Module 10: Heaps & Priority Queues',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m10-t1', name: 'Min heap, max heap', materials: {} },
          { id: 'dsa-m10-t2', name: 'Heap applications', materials: {} },
        ],
      },
      {
        id: 'dsa-m11',
        title: 'Module 11: Graphs',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m11-t1', name: 'Graph representation', materials: {} },
          { id: 'dsa-m11-t2', name: 'BFS, DFS', materials: {} },
          { id: 'dsa-m11-t3', name: 'Shortest path algorithms', materials: {} },
        ],
      },
      {
        id: 'dsa-m12',
        title: 'Module 12: Greedy Algorithms',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m12-t1', name: 'Optimization problems', materials: {} },
          { id: 'dsa-m12-t2', name: 'Activity selection, knapsack', materials: {} },
        ],
      },
      {
        id: 'dsa-m13',
        title: 'Module 13: Dynamic Programming',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m13-t1', name: 'Memoization and tabulation', materials: {} },
          { id: 'dsa-m13-t2', name: 'Classic DP problems', materials: {} },
        ],
      },
      {
        id: 'dsa-m14',
        title: 'Module 14: Advanced Problem Solving & Placement Readiness',
        level: 'Advanced',
        topics: [
          { id: 'dsa-m14-t1', name: 'Competitive coding strategies', materials: {} },
          { id: 'dsa-m14-t2', name: 'Interview problem solving', materials: {} },
          { id: 'dsa-m14-t3', name: 'Mock tests and assessments', materials: {} },
        ],
      },
    ],
  },
  {
    id: 'python-ds',
    name: 'Python for Data Science',
    description: 'Learn Python programming and data science techniques for real-world applications',
    instructor: 'Dr. Emily Watson',
    modules: [
      {
        id: 'py-m1',
        title: 'Module 1: Introduction to Data Science & Python Basics',
        level: 'Beginner',
        topics: [
          { id: 'py-m1-t1', name: 'Data Science overview, applications, careers', materials: {} },
          { id: 'py-m1-t2', name: 'Python setup and environment', materials: {} },
          { id: 'py-m1-t3', name: 'Variables, data types, input/output', materials: {} },
        ],
      },
      {
        id: 'py-m2',
        title: 'Module 2: Core Python Programming',
        level: 'Beginner',
        topics: [
          { id: 'py-m2-t1', name: 'Conditional statements', materials: {} },
          { id: 'py-m2-t2', name: 'Loops and functions', materials: {} },
          { id: 'py-m2-t3', name: 'Error handling and exceptions', materials: {} },
        ],
      },
      {
        id: 'py-m3',
        title: 'Module 3: Python Data Structures',
        level: 'Beginner',
        topics: [
          { id: 'py-m3-t1', name: 'Lists, tuples, sets, dictionaries', materials: {} },
          { id: 'py-m3-t2', name: 'String operations and comprehensions', materials: {} },
        ],
      },
      {
        id: 'py-m4',
        title: 'Module 4: NumPy – Numerical Computing',
        level: 'Intermediate',
        topics: [
          { id: 'py-m4-t1', name: 'Arrays, slicing, vectorization', materials: {} },
        ],
      },
      {
        id: 'py-m5',
        title: 'Module 5: Pandas – Data Analysis',
        level: 'Intermediate',
        topics: [
          { id: 'py-m5-t1', name: 'DataFrames, data cleaning, merging', materials: {} },
        ],
      },
      {
        id: 'py-m6',
        title: 'Module 6: Data Visualization',
        level: 'Intermediate',
        topics: [
          { id: 'py-m6-t1', name: 'Matplotlib and Seaborn', materials: {} },
        ],
      },
      {
        id: 'py-m7',
        title: 'Module 7: Statistics for Data Science',
        level: 'Intermediate',
        topics: [
          { id: 'py-m7-t1', name: 'Probability, distributions, hypothesis testing', materials: {} },
        ],
      },
      {
        id: 'py-m8',
        title: 'Module 8: Exploratory Data Analysis',
        level: 'Advanced',
        topics: [
          { id: 'py-m8-t1', name: 'Feature analysis, outliers', materials: {} },
        ],
      },
      {
        id: 'py-m9',
        title: 'Module 9: Machine Learning using Python',
        level: 'Advanced',
        topics: [
          { id: 'py-m9-t1', name: 'Regression, classification, evaluation', materials: {} },
        ],
      },
      {
        id: 'py-m10',
        title: 'Module 10: Advanced Data Science Tools',
        level: 'Advanced',
        topics: [
          { id: 'py-m10-t1', name: 'APIs, web scraping, SQL integration', materials: {} },
        ],
      },
      {
        id: 'py-m11',
        title: 'Module 11: Capstone Project & Industry Practices',
        level: 'Advanced',
        topics: [
          { id: 'py-m11-t1', name: 'End-to-end project development', materials: {} },
          { id: 'py-m11-t2', name: 'Resume & interview preparation', materials: {} },
        ],
      },
    ],
  },
  {
    id: 'fullstack-advanced',
    name: 'Full-Stack Advanced Development',
    description: 'Comprehensive full-stack development from web fundamentals to deployment',
    instructor: 'Prof. David Miller',
    modules: [
      {
        id: 'fs-m1',
        title: 'Module 1: Web Fundamentals',
        level: 'Beginner',
        topics: [
          { id: 'fs-m1-t1', name: 'Internet, HTTP/HTTPS, client-server model', materials: {} },
        ],
      },
      {
        id: 'fs-m2',
        title: 'Module 2: HTML5 & CSS3',
        level: 'Beginner',
        topics: [
          { id: 'fs-m2-t1', name: 'Semantic HTML, Flexbox, Grid, responsive design', materials: {} },
        ],
      },
      {
        id: 'fs-m3',
        title: 'Module 3: JavaScript Fundamentals',
        level: 'Beginner',
        topics: [
          { id: 'fs-m3-t1', name: 'DOM, events, ES6', materials: {} },
        ],
      },
      {
        id: 'fs-m4',
        title: 'Module 4: Programming & Version Control',
        level: 'Beginner',
        topics: [
          { id: 'fs-m4-t1', name: 'Git, GitHub, collaboration', materials: {} },
        ],
      },
      {
        id: 'fs-m5',
        title: 'Module 5: Advanced JavaScript',
        level: 'Intermediate',
        topics: [
          { id: 'fs-m5-t1', name: 'Async programming, modular JS', materials: {} },
        ],
      },
      {
        id: 'fs-m6',
        title: 'Module 6: Frontend Framework',
        level: 'Intermediate',
        topics: [
          { id: 'fs-m6-t1', name: 'Components, routing, state management', materials: {} },
        ],
      },
      {
        id: 'fs-m7',
        title: 'Module 7: Backend Development',
        level: 'Intermediate',
        topics: [
          { id: 'fs-m7-t1', name: 'REST APIs, MVC architecture', materials: {} },
        ],
      },
      {
        id: 'fs-m8',
        title: 'Module 8: Database Management',
        level: 'Intermediate',
        topics: [
          { id: 'fs-m8-t1', name: 'SQL & NoSQL databases', materials: {} },
        ],
      },
      {
        id: 'fs-m9',
        title: 'Module 9: Authentication & Authorization',
        level: 'Intermediate',
        topics: [
          { id: 'fs-m9-t1', name: 'JWT, OAuth, role-based access', materials: {} },
        ],
      },
      {
        id: 'fs-m10',
        title: 'Module 10: Advanced Backend & APIs',
        level: 'Advanced',
        topics: [
          { id: 'fs-m10-t1', name: 'Microservices, real-time apps', materials: {} },
        ],
      },
      {
        id: 'fs-m11',
        title: 'Module 11: System Design & Architecture',
        level: 'Advanced',
        topics: [
          { id: 'fs-m11-t1', name: 'Scalability, load balancing', materials: {} },
        ],
      },
      {
        id: 'fs-m12',
        title: 'Module 12: Security & Performance',
        level: 'Advanced',
        topics: [
          { id: 'fs-m12-t1', name: 'OWASP, optimization', materials: {} },
        ],
      },
      {
        id: 'fs-m13',
        title: 'Module 13: DevOps & Deployment',
        level: 'Advanced',
        topics: [
          { id: 'fs-m13-t1', name: 'Docker, CI/CD, cloud basics', materials: {} },
        ],
      },
      {
        id: 'fs-m14',
        title: 'Module 14: Capstone Project & Placement Readiness',
        level: 'Advanced',
        topics: [
          { id: 'fs-m14-t1', name: 'Industry project, resume, interviews', materials: {} },
        ],
      },
    ],
  },
];
