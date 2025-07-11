import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Animated,
  ImageBackground,
  Modal,
} from 'react-native';
import {
  useNavigation,
  NavigationProp,
  RouteProp,
  useRoute,
} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import {fruitsQuizData} from '../data/quizData/fruits';
import { animalsQuizData, questionItem } from '../data/quizData/animals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import {countingQuizData} from '../data/quizData/counting';
import Sound from 'react-native-sound';
import achievement from '../assets/achievementImages';
import { useLanguage } from '../context/languageContext'; // Add this import

const QuizScreen: React.FC = () => {
  const { language } = useLanguage() as { language: 'Eng' | 'Dzo' };
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [fadeAnim] = useState<Animated.Value>(new Animated.Value(0));
  const [bounceAnim] = useState<Animated.Value>(new Animated.Value(0));
  const route = useRoute<RouteProp<RootStackParamList, 'QuizScreen'>>();
  const {category} = route.params;
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [previouslyCompleted, setPreviouslyCompleted] =
    useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [, setStarsAwarded] = useState<boolean>(false);
  const [waitingForTracing, setWaitingForTracing] = useState<boolean>(false);
  const [returningFromTracing, setReturningFromTracing] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
const [errorMessage, setErrorMessage] = useState<string>('');

  const [screenDimensions] = useState<{
    width: number;
    height: number;
  }>(Dimensions.get('window'));

  const QUIZ_ACHIEVEMENTS: Record<string, string> = {
    animals: 'achievement4',
    fruits: 'achievement5',
    counting: 'achievement6',
    // Add more categories and their corresponding achievements as needed
  };


  const achievementId = QUIZ_ACHIEVEMENTS[category];
  const achievementImage = achievementId && achievementId in achievement ? achievement[achievementId as keyof typeof achievement] : null;


  const relatedTo =
    category === 'animals' || category === 'fruits' ? 'alphabets' : 'numbers';

    const quizQuestions: questionItem[] =
    category === 'animals'
      ? animalsQuizData
      : category === 'fruits'
      ? fruitsQuizData
      : category === 'counting'
      ? countingQuizData
      : [];
      
  const isSmallScreen = screenDimensions.width < 375;

  useEffect(() => {
    checkPreviousCompletion();
    // Fade in animation for each new question or completion screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Bounce animation for the question
    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [bounceAnim, currentQuestionIndex, fadeAnim, quizCompleted]);

  const checkPreviousCompletion = async () => {
    try {
      const quizKey = `quiz_${category}_completed`;
      const starKey = `quiz_${category}_stars`;

      const completedStatus = await AsyncStorage.getItem(quizKey);
      const previousStars = await AsyncStorage.getItem(starKey);

      if (completedStatus === 'true' && previousStars) {
        setPreviouslyCompleted(true);
        setEarnedStars(parseInt(previousStars, 10));
      }
    } catch (error) {
      console.error('Error checking previous completion:', error);
    }
  };

  const saveQuizCompletion = async (stars: number) => {
    try {
      const quizKey = `quiz_${category}_completed`;
      const starKey = `quiz_${category}_stars`;

      await AsyncStorage.setItem(quizKey, 'true');
      await AsyncStorage.setItem(starKey, stars.toString());

      // update category star in the main storage
      await updateCategoryStars(category, stars);

      // Award 5 stars if this is the first completion
      if (!previouslyCompleted) {
        await awardStarsForFirstCompletion();
        setStarsAwarded(true);

        // Unlock the corresponding achievement
        const achievementId = QUIZ_ACHIEVEMENTS[category];
        if (achievementId) {
          await unlockAchievement(achievementId);
        }
      }
    } catch (error) {
      console.error('Error saving quiz completion:', error);
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      const isGuest = await AsyncStorage.getItem('is_guest');
      const achievementsKey =
        isGuest === 'true' ? 'guest_achievements' : 'achievements';

      // Get current achievements
      const currentAchievements = await AsyncStorage.getItem(achievementsKey);
      const achievements = currentAchievements
        ? JSON.parse(currentAchievements)
        : {};

      // Check if achievement is already unlocked
      if (!achievements[achievementId]) {
        // Unlock the achievement
        achievements[achievementId] = true;
        await AsyncStorage.setItem(
          achievementsKey,
          JSON.stringify(achievements),
        );

        // Show achievement unlocked message
        Alert.alert('Congratulations!', `You've unlocked a new achievement!`, [
          {text: 'OK'},
        ]);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  };

  const awardStarsForFirstCompletion = async () => {
    try {
      // Get current total star count
      const isGuest = await AsyncStorage.getItem('is_guest');
      const starCountKey = isGuest === 'true' ? 'guest_starCount' : 'starCount';

      const currentStarCount = await AsyncStorage.getItem(starCountKey);
      const currentStars = currentStarCount
        ? parseInt(currentStarCount, 10)
        : 0;

      // Add 5 stars
      const newStarCount = currentStars + 5;

      // Save updated star count
      await AsyncStorage.setItem(starCountKey, newStarCount.toString());

      console.log(
        `Awarded 5 stars for first completion of ${category} quiz. New total: ${newStarCount}`,
      );
    } catch (error) {
      console.error('Error awarding stars:', error);
    }
  };

  const updateCategoryStars = async (categoryName: string, stars: number) => {
    try {
      // Get current stars data
      const starsData = await AsyncStorage.getItem('category_stars');
      const currentStarsData = starsData ? JSON.parse(starsData) : {};

      // Update stars for this category
      currentStarsData[categoryName] = stars;

      // Save updated stars data
      await AsyncStorage.setItem(
        'category_stars',
        JSON.stringify(currentStarsData),
      );
    } catch (error) {
      console.error('Error updating category stars:', error);
    }
  };

  const calculateStars = (score: number, total: number): number => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) {
      return 3;
    }
    if (percentage >= 70) {
      return 2;
    }
    if (percentage >= 50) {
      return 1;
    }
    return 0;
  };

  const alphabetMapping: Record<string, number> = {
    ཀ: 1,
    ཕ: 14,
    ད: 11,
    བ: 15,
    ག: 3,
    ཨ: 30,
    ང: 4,
    ཚ: 18,
    ཁ: 2,
    ཧ: 29,
  };

  const handleAnswerPress = (selectedAnswer: string): void => {
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
    

    if (selectedAnswer === currentQuestion.correctAnswer) {
      playCorrectSound();
      setScore(score + 1);

      console.log('Is last question?', isLastQuestion);

      // For tracing categories (counting/animals/fruits)
      if (
        category === 'counting' ||
        category === 'animals' ||
        category === 'fruits'
      ) {
        setWaitingForTracing(true);
        setReturningFromTracing(true);

        let tracingId: string;
        let tracingCategory: string;

        if (category === 'counting') {
          const current_id = Number(currentQuestion.correctAnswer);
          tracingId = (current_id + 1).toString();
          tracingCategory = 'numbers';
        } else {
          // Animals/fruits
          tracingId =
            alphabetMapping[currentQuestion.correctAnswer]?.toString();
          if (!tracingId) {
            console.error(`No mapping for ${currentQuestion.correctAnswer}`);
            Alert.alert('Error', 'Could not find tracing item');
            return;
          }
          tracingCategory = 'alphabets';
        }

        navigation.navigate('Tracing', {
          id: tracingId,
          category: tracingCategory,
          fromQuiz: true,
          isLastQuestion,
        });
        if (isLastQuestion) {
          console.log('i am in the if function for last question');
          setTimeout(() => {
            completeQuiz();
          }, 5000);
          return;
          // completeQuiz();
        } else {
          fadeAnim.setValue(0);
          bounceAnim.setValue(0);
        }
        return;
      }
    } else {
      playWrongSound();
      // Alert.alert('དགོངསམ་མ་ཁྲེལ།', 'ཁྱོད་ཀྱིས་གདམ་ཁ་འཛོལ་བ་འབད་ཡི།', [
      //   {text: 'OK'},
      // ]);
      if(language==='Dzo'){
        setErrorMessage('ཁྱོད་ཀྱིས་གདམ་ཁ་འཛོལ་བ་འབད་ཡི།');
      }
      else if(language==='Eng'){
        setErrorMessage('You have selected the wrong answer');
      }
setErrorModalVisible(true);

// Auto-dismiss after 2 seconds
setTimeout(() => {
  setErrorModalVisible(false);
}, 2500);
    }
  };

  const completeQuiz = () => {
    const stars = calculateStars(score + 1, quizQuestions.length);
    setEarnedStars(stars);

    if (!previouslyCompleted || stars > earnedStars) {
      saveQuizCompletion(stars);
    }

    fadeAnim.setValue(0);
    setQuizCompleted(true);
    setShowCelebration(true);
  };

  const playCorrectSound = (): void => {
    // Make sure you have a copy of the sound in your assets folder
    const sound = new Sound(
      require('../assets/sound/completion_sound.mp3'),
      error => {
        if (error) {
          console.log('Failed to load sound with require:', error);
          return;
        }
        sound.play(() => sound.release());
      },
    );
  };

  const playWrongSound = (): void => {
    // Make sure you have a copy of the sound in your assets folder
    const sound = new Sound(require('../assets/sound/wrong_ans.mp3'), error => {
      if (error) {
        console.log('Failed to load sound with require:', error);
        return;
      }
      sound.play(() => sound.release());
    });
  };

  const resetQuiz = (): void => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
    setShowCelebration(false);
    fadeAnim.setValue(0);
    bounceAnim.setValue(0);

    // Start animations again
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only move to next question if we're returning from tracing
      if (
        (category === 'counting' ||
          category === 'animals' ||
          category === 'fruits') &&
        returningFromTracing &&
        !quizCompleted
      ) {
        // Check if it was the last question
      if (currentQuestionIndex === quizQuestions.length - 1) {
        completeQuiz(); 
      }else{
        fadeAnim.setValue(0);
        bounceAnim.setValue(0);
        setCurrentQuestionIndex(prev => prev + 1);
      }
       setWaitingForTracing(false);
        setReturningFromTracing(false);
    }
    });

    return unsubscribe;
  }, [
    navigation,
    quizCompleted,
    waitingForTracing,
    returningFromTracing,
    category,
  ]);

  const renderQuizContent = (): JSX.Element => {
    if (quizCompleted) {
      return (
        <ImageBackground
          source={require('../assets/background_images/guided_bg.jpeg')}
          style={styles.completionBackground}>
          <View style={styles.completionSideImagesContainer}>
            {/* Left side image */}
            <Image
              source={require('../assets/icons/boy.png')} // Replace with your left image
              style={styles.completionSideImage}
              resizeMode="contain"
            />

            {/* Completion container */}
            <Animated.View
              style={[styles.completionContainer, {opacity: fadeAnim}]}>
              <Text style={styles.completionText}>Quiz Completed!</Text>

              {/* Show achievement unlocked message if this is first completion */}
              {!previouslyCompleted && QUIZ_ACHIEVEMENTS[category] && (
                <View style={styles.achievementContainer}>
                  <Image
                    source={require('../assets/icons/star.png')} // Add your achievement icon
                    style={styles.achievementImage}
                  />
                  <Text style={styles.achievementText}>
                    New Achievement Unlocked!
                  </Text>
                </View>
              )}

              {/* Show star award message if this is first completion */}
              {!previouslyCompleted && (
                <View style={styles.starAwardContainer}>
                  <Image
                    source={require('../assets/icons/star.png')}
                    style={styles.starAwardImage}
                  />
                  <Text style={styles.starAwardText}>5 Stars Awarded!</Text>
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={resetQuiz}>
                  <Text style={styles.resetButtonText}>Play Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => {
                    navigation.navigate('QuizHomeScreen', {
                      quizCategory: relatedTo,
                      fromCompletionScreen: true,
                    });
                  }}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Right side image */}
            <Image
              source={require('../assets/icons/girl.png')}
              style={styles.completionSideImage}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
      );
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];

    const bounceInterpolation = bounceAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    return (
      <ImageBackground
        source={require('../assets/background_images/landing_bg.png')}
        style={styles.backgroundImage}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Image
            source={require('../assets/icons/back_color.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Animated.View style={[styles.quizContainer, {opacity: fadeAnim}]}>
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1}/{quizQuestions.length}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((currentQuestionIndex + 1) / quizQuestions.length) * 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Question */}
          <Animated.View
  style={[
    styles.questionContainer,
    {transform: [{translateY: bounceInterpolation}]},
  ]}>
  <Text
    style={[
      styles.questionText,
      isSmallScreen && styles.questionTextSmall,
    ]}>
    {language === 'Eng'
      ? currentQuestion.questionEng
      : currentQuestion.questionDzo}
  </Text>

            {/* Question Image */}
            <View style={styles.imageContainer}>
              <Image
                source={currentQuestion.image}
                style={styles.questionImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Answer Options in 2x2 grid */}
          <View style={styles.optionsGridContainer}>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.optionButtonGrid,
                  isSmallScreen && styles.optionButtonSmall,
                ]}
                onPress={() => handleAnswerPress(currentQuestion.options[0])}>
                <Text
                  style={[
                    styles.optionText,
                    isSmallScreen && styles.optionTextSmall,
                  ]}>
                  {currentQuestion.options[0]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.optionButtonGrid,
                  isSmallScreen && styles.optionButtonSmall,
                ]}
                onPress={() => handleAnswerPress(currentQuestion.options[1])}>
                <Text
                  style={[
                    styles.optionText,
                    isSmallScreen && styles.optionTextSmall,
                  ]}>
                  {currentQuestion.options[1]}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.optionButtonGrid,
                  isSmallScreen && styles.optionButtonSmall,
                ]}
                onPress={() => handleAnswerPress(currentQuestion.options[2])}>
                <Text
                  style={[
                    styles.optionText,
                    isSmallScreen && styles.optionTextSmall,
                  ]}>
                  {currentQuestion.options[2]}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  styles.optionButtonGrid,
                  isSmallScreen && styles.optionButtonSmall,
                ]}
                onPress={() => handleAnswerPress(currentQuestion.options[3])}>
                <Text
                  style={[
                    styles.optionText,
                    isSmallScreen && styles.optionTextSmall,
                  ]}>
                  {currentQuestion.options[3]}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Custom error modal */}
<Modal
  transparent={true}
  animationType="fade"
  visible={errorModalVisible}
  onRequestClose={() => setErrorModalVisible(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{language==='Dzo'?'དགོངསམ་མ་ཁྲེལ།':'Sorry :('}</Text>
      <Text style={styles.modalMessage}>{errorMessage}</Text>
    </View>
  </View>
</Modal>
        </Animated.View>
      </ImageBackground>
    );
  };

  return <View style={styles.container}>{renderQuizContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '85%',
    marginBottom: 8,
    alignSelf: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2682F4',
    marginBottom: 2,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2682F4',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8C00',
    borderRadius: 4,
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 5,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2682F4',
    marginBottom: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  questionText: {
    fontSize: 40,
    fontFamily: 'joyig',
    color: '#EF8D38',
    textAlign: 'center',
    marginBottom: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  questionTextSmall: {
    fontSize: 20,
    fontFamily: 'joyig',
  },
  imageContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  questionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    resizeMode: 'contain',
  },
  optionsGridContainer: {
    width: '85%',
    alignSelf: 'center',
    marginBottom: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(38, 130, 244, 0.9)',
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  optionButtonGrid: {
    width: '48%',
    minHeight: 55,
    justifyContent: 'center',
  },
  optionButtonSmall: {
    padding: 6,
    minHeight: 40,
  },
  optionText: {
    fontSize: 45,
    fontFamily: 'joyig',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  optionTextSmall: {
    fontSize: 18,
  },

  starAwardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  starAwardImage: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  starAwardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0.5, height: 0.5},
    textShadowRadius: 1,
  },
  completionBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionSideImagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '95%',
  },
  completionSideImage: {
    width: 200,
    height: 200,
  },
  completionContainer: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 70,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#2682F4',
    // width: '80%',
    maxHeight: '80%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    width: '50%',
  },
  completionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF8D38',
    marginBottom: 10,
    textAlign: 'center',
  },
  previousCompletionText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  resetButton: {
    backgroundColor: '#FF8C00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nextButton: {
    backgroundColor: '#2682F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFF',
    marginLeft: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  celebrationOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  celebrationAnimation: {
    width: 300,
    height: 300,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Green background
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  achievementImage: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  achievementText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0.5, height: 0.5},
    textShadowRadius: 1,
  },
  headerIcon: {
    height: 40,
    width: 40,
    marginTop: 25,
    marginLeft: 15,
    resizeMode: 'contain',
  },
  headerButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional: Add a semi-transparent background
  },
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  modalTitle: {
    fontSize: 50,
    fontFamily: 'joyig',
    color: '#EF8D38',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  modalMessage: {
    fontSize: 30,
    fontFamily: 'joyig',
    color: '#333',
    textAlign: 'center',
  },
});

export default QuizScreen;
