const { CURRICULUM_MASTER_DATA } = require('./src/data/curriculumMasterData');

// Create comprehensive activity templates that match specific topics
const TOPIC_SPECIFIC_ACTIVITIES = {};

// Generate activities for each topic in the curriculum
CURRICULUM_MASTER_DATA.forEach(gradeCurriculum => {
  const grade = gradeCurriculum.grade;
  
  gradeCurriculum.subjects.forEach(subject => {
    const subjectKey = subject.name.toUpperCase();
    
    subject.topics.forEach(topic => {
      const topicKey = topic.id;
      
      // Generate 3-5 activities per topic
      const activities = generateActivitiesForTopic(subject.name, topic, grade);
      
      if (!TOPIC_SPECIFIC_ACTIVITIES[subjectKey]) {
        TOPIC_SPECIFIC_ACTIVITIES[subjectKey] = {};
      }
      
      TOPIC_SPECIFIC_ACTIVITIES[subjectKey][topicKey] = activities;
    });
  });
});

function generateActivitiesForTopic(subjectName, topic, grade) {
  const activities = [];
  const topicName = topic.name;
  const difficulty = topic.difficulty;
  
  // Generate different types of activities based on subject and topic
  if (subjectName === 'Mathematics') {
    activities.push(...generateMathActivities(topicName, topic.id, difficulty, grade));
  } else if (subjectName === 'English') {
    activities.push(...generateEnglishActivities(topicName, topic.id, difficulty, grade));
  } else if (subjectName === 'Science') {
    activities.push(...generateScienceActivities(topicName, topic.id, difficulty, grade));
  } else if (subjectName === 'History') {
    activities.push(...generateHistoryActivities(topicName, topic.id, difficulty, grade));
  } else if (subjectName === 'Geography') {
    activities.push(...generateGeographyActivities(topicName, topic.id, difficulty, grade));
  }
  
  return activities;
}

function generateMathActivities(topicName, topicId, difficulty, grade) {
  const activities = [];
  
  if (topicId.includes('counting')) {
    activities.push(
      {
        title: `${topicName} Practice`,
        description: `Interactive counting exercises for ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Quiz`,
        description: `Test your knowledge of ${topicName.toLowerCase()}`,
        type: 'quiz',
        estimatedDuration: 10,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('addition') || topicId.includes('subtraction')) {
    activities.push(
      {
        title: `${topicName} Problems`,
        description: `Solve ${topicName.toLowerCase()} problems with visual aids`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Word Problems`,
        description: `Apply ${topicName.toLowerCase()} to real-world scenarios`,
        type: 'text',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('shapes') || topicId.includes('geometry')) {
    activities.push(
      {
        title: `${topicName} Game`,
        description: `Identify and work with ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Drawing`,
        description: `Draw and create ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('fractions') || topicId.includes('decimals')) {
    activities.push(
      {
        title: `${topicName} Visual Learning`,
        description: `Understand ${topicName.toLowerCase()} with visual representations`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Practice Problems`,
        description: `Solve ${topicName.toLowerCase()} problems step by step`,
        type: 'quiz',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('algebra')) {
    activities.push(
      {
        title: `${topicName} Introduction`,
        description: `Learn the basics of ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 30,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Problem Solving`,
        description: `Practice solving ${topicName.toLowerCase()} problems`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      }
    );
  } else {
    // Generic math activities
    activities.push(
      {
        title: `${topicName} Exploration`,
        description: `Explore and understand ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Assessment`,
        description: `Test your understanding of ${topicName.toLowerCase()}`,
        type: 'quiz',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      }
    );
  }
  
  return activities;
}

function generateEnglishActivities(topicName, topicId, difficulty, grade) {
  const activities = [];
  
  if (topicId.includes('alphabet') || topicId.includes('phonics')) {
    activities.push(
      {
        title: `${topicName} Practice`,
        description: `Interactive ${topicName.toLowerCase()} learning activities`,
        type: 'interactive',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Games`,
        description: `Fun games to master ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('reading') || topicId.includes('comprehension')) {
    activities.push(
      {
        title: `${topicName} Exercises`,
        description: `Read passages and answer questions about ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Discussion`,
        description: `Discuss and analyze texts for ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('writing') || topicId.includes('creative')) {
    activities.push(
      {
        title: `${topicName} Workshop`,
        description: `Practice ${topicName.toLowerCase()} with guided exercises`,
        type: 'text',
        estimatedDuration: 30,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Projects`,
        description: `Create original works using ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 35,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('grammar') || topicId.includes('vocabulary')) {
    activities.push(
      {
        title: `${topicName} Lessons`,
        description: `Learn and practice ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Quiz`,
        description: `Test your knowledge of ${topicName.toLowerCase()}`,
        type: 'quiz',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      }
    );
  } else {
    // Generic English activities
    activities.push(
      {
        title: `${topicName} Study`,
        description: `Comprehensive study of ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Practice`,
        description: `Practice exercises for ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  }
  
  return activities;
}

function generateScienceActivities(topicName, topicId, difficulty, grade) {
  const activities = [];
  
  if (topicId.includes('living') || topicId.includes('animal') || topicId.includes('plant')) {
    activities.push(
      {
        title: `${topicName} Observation`,
        description: `Observe and study ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Classification`,
        description: `Classify and categorize ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('experiment') || topicId.includes('chemistry') || topicId.includes('physics')) {
    activities.push(
      {
        title: `${topicName} Experiments`,
        description: `Conduct safe experiments related to ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 30,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Analysis`,
        description: `Analyze results and draw conclusions about ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('body') || topicId.includes('health')) {
    activities.push(
      {
        title: `${topicName} Exploration`,
        description: `Learn about ${topicName.toLowerCase()} through interactive models`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Health Connection`,
        description: `Connect ${topicName.toLowerCase()} to personal health`,
        type: 'text',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else {
    // Generic science activities
    activities.push(
      {
        title: `${topicName} Investigation`,
        description: `Investigate and explore ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Quiz`,
        description: `Test your understanding of ${topicName.toLowerCase()}`,
        type: 'quiz',
        estimatedDuration: 15,
        relatedTopics: [topicId]
      }
    );
  }
  
  return activities;
}

function generateHistoryActivities(topicName, topicId, difficulty, grade) {
  const activities = [];
  
  activities.push(
    {
      title: `${topicName} Timeline`,
      description: `Create and study timelines for ${topicName.toLowerCase()}`,
      type: 'interactive',
      estimatedDuration: 25,
      relatedTopics: [topicId]
    },
    {
      title: `${topicName} Research`,
      description: `Research key figures and events in ${topicName.toLowerCase()}`,
      type: 'text',
      estimatedDuration: 30,
      relatedTopics: [topicId]
    },
    {
      title: `${topicName} Analysis`,
      description: `Analyze causes and effects in ${topicName.toLowerCase()}`,
      type: 'text',
      estimatedDuration: 25,
      relatedTopics: [topicId]
    }
  );
  
  return activities;
}

function generateGeographyActivities(topicName, topicId, difficulty, grade) {
  const activities = [];
  
  if (topicId.includes('map') || topicId.includes('direction')) {
    activities.push(
      {
        title: `${topicName} Practice`,
        description: `Practice ${topicName.toLowerCase()} with interactive maps`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Navigation`,
        description: `Learn navigation skills using ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      }
    );
  } else if (topicId.includes('climate') || topicId.includes('weather')) {
    activities.push(
      {
        title: `${topicName} Study`,
        description: `Study patterns and effects of ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Tracking`,
        description: `Track and analyze ${topicName.toLowerCase()} data`,
        type: 'interactive',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  } else {
    // Generic geography activities
    activities.push(
      {
        title: `${topicName} Exploration`,
        description: `Explore and learn about ${topicName.toLowerCase()}`,
        type: 'interactive',
        estimatedDuration: 25,
        relatedTopics: [topicId]
      },
      {
        title: `${topicName} Mapping`,
        description: `Create maps and diagrams for ${topicName.toLowerCase()}`,
        type: 'text',
        estimatedDuration: 20,
        relatedTopics: [topicId]
      }
    );
  }
  
  return activities;
}

// Export the generated activities
console.log('Generated topic-specific activities:');
console.log(JSON.stringify(TOPIC_SPECIFIC_ACTIVITIES, null, 2));

// Save to file
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'src', 'data', 'topicSpecificActivities.ts');
const content = `// Auto-generated topic-specific activities
// This file contains activities that match specific curriculum topics

export interface TopicActivity {
  title: string;
  description: string;
  type: 'interactive' | 'quiz' | 'text' | 'video';
  estimatedDuration: number;
  relatedTopics: string[];
}

export interface SubjectActivities {
  [topicId: string]: TopicActivity[];
}

export interface TopicSpecificActivities {
  [subject: string]: SubjectActivities;
}

export const TOPIC_SPECIFIC_ACTIVITIES: TopicSpecificActivities = ${JSON.stringify(TOPIC_SPECIFIC_ACTIVITIES, null, 2)};

export const getActivitiesForTopic = (subject: string, topicId: string): TopicActivity[] => {
  const subjectKey = subject.toUpperCase();
  return TOPIC_SPECIFIC_ACTIVITIES[subjectKey]?.[topicId] || [];
};

export const getActivitiesForTopics = (subject: string, topicIds: string[]): TopicActivity[] => {
  const subjectKey = subject.toUpperCase();
  const activities: TopicActivity[] = [];
  
  topicIds.forEach(topicId => {
    const topicActivities = TOPIC_SPECIFIC_ACTIVITIES[subjectKey]?.[topicId] || [];
    activities.push(...topicActivities);
  });
  
  return activities;
};
`;

fs.writeFileSync(outputPath, content);
console.log(`\nTopic-specific activities saved to: ${outputPath}`);