import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import avatarImages from '../assets/avatarImages';
import {RootStackParamList} from '../types';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import axiosInstance from '../Api/config/axiosInstance';
import api from '../Api/endPoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import {useLanguage} from '../context/languageContext'; // Import language context

const {width, height} = Dimensions.get('window');

const AvatarScreen = () => {
  interface AvatarBorder {
    id: number;
    nameKey: string;
    cost: number;
    image: any;
    is_purchased: boolean;
  }

  // Define a type for available languages
  type LanguageType = 'Eng' | 'Dzo';

  // Define a type for translation keys
  type TranslationKey =
    | 'loading'
    | 'buyButton'
    | 'equipButton'
    | 'closeButton'
    | 'notEnoughStars'
    | 'purchaseSuccess'
    | 'equipSuccess'
    | 'purchaseError'
    | 'equipError'
    | 'isPurchased'
    | 'notPurchased'
    | 'price'
    | 'okay'
    | 'bronzeBorder'
    | 'silverBorder'
    | 'goldenFlameBorder'
    | 'diamondCrownBorder';

  // Get language context
  const {language} = useLanguage() as {language: LanguageType};

  const [avatarBorders, setAvatarBorders] = useState<AvatarBorder[]>([]);
  const [selectedBorder, setSelectedBorder] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentAvatarBorder, setCurrentAvatarBorder] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // New notification modal state
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Text translations based on selected language
  const translations: Record<LanguageType, Record<TranslationKey, string>> = {
    Eng: {
      loading: 'Loading...',
      buyButton: 'Buy',
      equipButton: 'Equip',
      closeButton: 'Close',
      notEnoughStars: 'You do not have enough stars to purchase this border.',
      purchaseSuccess: 'Border purchased successfully!',
      equipSuccess: 'Border equipped successfully!',
      purchaseError:
        'An error occurred while purchasing the border. Please try again.',
      equipError:
        'An error occurred while equipping the border. Please try again.',
      isPurchased: 'This border has been purchased.',
      notPurchased: 'This border has not been purchased.',
      price: 'Price: ',
      okay: 'Okay',
      bronzeBorder: 'Bronze Border',
      silverBorder: 'Silver Border',
      goldenFlameBorder: 'Golden Flame Border',
      diamondCrownBorder: 'Diamond Crown Border',
    },
    Dzo: {
      loading: 'བསྒུག...',
      buyButton: 'ཉོ་ནི།',
      equipButton: 'བཙུགས་ནི།',
      closeButton: 'ཁ་བསྡམ་ནི།',
      notEnoughStars: 'ཁྱོད་ལུ་མཐའ་མཚམས་འདི་ ཉོ་ནི་གི་སྐར་མ་ མི་ལངམ་མེད།',
      purchaseSuccess: 'མཐའ་མཚམས་ ཉོ་ནི་མཐར་འཁྱོལ་བྱུང་ཡི!',
      equipSuccess: 'མཐའ་མཚམས་ བཙུགས་ནི་མཐར་འཁྱོལ་བྱུང་ཡི!',
      purchaseError: 'མཐའ་མཚམས་ཉོ་བའི་སྐབས་ལུ་འཛོལ་བ་ཅིག་བྱུང་ཡི། ལོག་འབད་དགོ།',
      equipError: 'མཐའ་མཚམས་བཙུགས་པའི་སྐབས་ལུ་འཛོལ་བ་ཅིག་བྱུང་ཡི། ལོག་འབད་དགོ།',
      isPurchased: 'ཨ་ནཱི་ས་མཚམས་འདི་ ཉོ་མི་ཨིན།',
      notPurchased: 'ཨ་ནཱི་ས་མཚམས་འདི་ ཉོ་མི་མེན།',
      price: 'གོང་ཚད་ : ',
      okay: 'འཐུས།',
      bronzeBorder: 'རག་གྱི་ མཐའ་མཚམས།',
      silverBorder: 'དངུལ་གྱི་ མཐའ་མཚམས།',
      goldenFlameBorder: 'གསེར་གྱི་ མཐའ་མཚམས།',
      diamondCrownBorder: 'རྡོ་རྗེ་ཕ་ལམ་གྱི་ མཐའ་མཚམས།',
    },
  };

  // Get text based on current language
  const getText = (key: TranslationKey): string => {
    return translations[language][key] || translations['Eng'][key];
  };

  // Function to get language-specific font size
  const getFontSize = (baseSize: number): number => {
    return language === 'Dzo'
      ? baseSize * 1.25 // 25% larger for Dzongkha
      : baseSize;
  };

  // Show notification modal instead of Alert
  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setNotificationModalVisible(true);
  };

  useEffect(() => {
    const initializeScreen = async () => {
      setLoading(true);
      try {
        // Check if the user is a guest
        const isGuestValue = await AsyncStorage.getItem('is_guest');
        setIsGuest(isGuestValue === 'true');

        if (isGuestValue === 'true') {
          // Guest Mode: Use local data
          const storedBorders = await AsyncStorage.getItem(
            'guest_avatar_borders',
          );
          const localBorders = storedBorders
  ? JSON.parse(storedBorders).map((border: any) => ({
      ...border,
      image: avatarImages[`avatar${border.id}` as keyof typeof avatarImages],
    }))
  : [
      {
        id: 1,
        nameKey: 'bronzeBorder',
        cost: 2,
        image: avatarImages.avatar1,
        is_purchased: false,
      },
      {
        id: 2,
        nameKey: 'silverBorder',
        cost: 3,
        image: avatarImages.avatar2,
        is_purchased: false,
      },
      {
        id: 3,
        nameKey: 'goldenFlameBorder',
        cost: 4,
        image: avatarImages.avatar3,
        is_purchased: false,
      },
      {
        id: 4,
        nameKey: 'diamondCrownBorder',
        cost: 6,
        image: avatarImages.avatar4,
        is_purchased: false,
      },
    ];
          console.log('Local Borders', localBorders);
          setAvatarBorders(localBorders);

          // Check if a border is equipped locally
          const equippedBorder = await AsyncStorage.getItem(
            'guest_current_avatar_border',
          );
          setCurrentAvatarBorder(
            equippedBorder ? Number(equippedBorder) : null,
          );
        } else {
          // Online Mode: Fetch data from the backend
          const userId = await AsyncStorage.getItem('user_id');
          if (!userId) {
            console.error('User ID not found in AsyncStorage');
            return;
          }

          const purchasedBorderResponses = await axiosInstance.get(
            api.avatar.getUserAvatarBorders,
          );
          const allBorderRespose = await axiosInstance.get(
            api.avatar.getAvatarBorders,
          );

          const allBorders = allBorderRespose.data;
          const purchasedBorders = purchasedBorderResponses.data;

          // User equip border
          const equippedAvatarBorder = await AsyncStorage.getItem(
            'current_avatar_border',
          );
          setCurrentAvatarBorder(
            equippedAvatarBorder ? Number(equippedAvatarBorder) : null,
          );

          const combinedBorders = allBorders.map(
            (border: any, index: number) => ({
              ...border,
              image:
                avatarImages[`avatar${index + 1}` as keyof typeof avatarImages],
              is_purchased: purchasedBorders.some(
                (purchasedBorder: any) => purchasedBorder.id === border.id,
              ),
            }),
          );

          setAvatarBorders(combinedBorders);
        }
      } catch (error) {
        console.error('Error initializing AvatarScreen:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, []);

  const handleBorderPress = (border: any) => {
    setSelectedBorder(border);
    setModalVisible(true);
  };

  const renderBorder = ({item}: {item: any}) => (
    <TouchableOpacity
      style={[
        styles.avatarContainer,
        item.id === currentAvatarBorder && styles.equippedBorder,
      ]}
      onPress={() => handleBorderPress(item)}>
      <Image
        source={item.image}
        style={[
          styles.avatarImage,
          item.is_purchased ? styles.purchasedBorder : styles.unpurchasedBorder,
        ]}
      />
    </TouchableOpacity>
  );

  const handleBuyBorder = async () => {
    if (isGuest) {
      const guest_starCount = await AsyncStorage.getItem('guest_starCount');
      // Guest Mode: Update local data
      if (selectedBorder.cost > Number(guest_starCount)) {
        showNotification(getText('notEnoughStars'));
        return;
      }

      // Calculate new star count
      const newStarCount = Number(guest_starCount) - selectedBorder.cost;
      // Update AsyncStorage with new star count
      await AsyncStorage.setItem('guest_starCount', newStarCount.toString());

      const updatedBorders = avatarBorders.map(border =>
        border.id === selectedBorder.id
          ? {...border, is_purchased: true}
          : border,
      );
      setAvatarBorders(updatedBorders);
      await AsyncStorage.setItem(
        'guest_avatar_borders',
        JSON.stringify(updatedBorders),
      );

      // Force navigation to refresh SharedLayout
      navigation.navigate('Guided');

      showNotification(getText('purchaseSuccess'));
      setModalVisible(false);
    } else {
      // Online Mode: Perform backend operations
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) {
          console.error('User ID not found in AsyncStorage');
          return;
        }

        const userDetails = await axiosInstance.get(
          api.user.getUserData(Number(userId)),
        );
        const userStars = userDetails.data.starCount;

        if (userStars < selectedBorder.cost) {
          showNotification(getText('notEnoughStars'));
        } else {
          const updatedStars = userStars - selectedBorder.cost;

          await axiosInstance.post(api.user.updateUserData(Number(userId)), {
            starCount: updatedStars,
          });

          await axiosInstance.post(api.avatar.updateUserAvatarBorder, {
            avatar_border_id: selectedBorder.id,
          });

          const purchasedBorderResponses = await axiosInstance.get(
            api.avatar.getUserAvatarBorders,
          );
          const allBorderRespose = await axiosInstance.get(
            api.avatar.getAvatarBorders,
          );

          const allBorders = allBorderRespose.data;
          const purchasedBorders = purchasedBorderResponses.data;

          const combinedBorders = allBorders.map(
            (border: any, index: number) => ({
              ...border,
              image:
                avatarImages[`avatar${index + 1}` as keyof typeof avatarImages],
              is_purchased: purchasedBorders.some(
                (purchasedBorder: any) => purchasedBorder.id === border.id,
              ),
            }),
          );

          setAvatarBorders(combinedBorders);
          showNotification(getText('purchaseSuccess'));
          setModalVisible(false);
        }
      } catch (error) {
        console.error('Error purchasing border:', error);
        showNotification(getText('purchaseError'));
      }
    }
  };

  const handleEquipBorder = async () => {
    if (isGuest) {
      // Guest Mode: Update local data
      await AsyncStorage.setItem(
        'guest_current_avatar_border',
        selectedBorder.id.toString(),
      );
      setCurrentAvatarBorder(selectedBorder.id);
      showNotification(getText('equipSuccess'));
      navigation.navigate('Guided');
      setModalVisible(false);
    } else {
      // Online Mode: Perform backend operations
      try {
        const userId = await AsyncStorage.getItem('user_id');
        if (!userId) {
          console.error('User ID not found in AsyncStorage');
          return;
        }

        await axiosInstance.patch(api.user.updateUserData(Number(userId)), {
          current_avatar_border_id: selectedBorder.id,
        });

        await AsyncStorage.setItem(
          'current_avatar_border',
          selectedBorder.id.toString(),
        );
        setCurrentAvatarBorder(selectedBorder.id);
        showNotification(getText('equipSuccess'));
        setModalVisible(false);
      } catch (error) {
        console.error('Error equipping border:', error);
        showNotification(getText('equipError'));
      }
    }
  };

  // Create dynamic styles based on language and screen dimensions
  const dynamicStyles = StyleSheet.create({
    modalTitle: {
      fontFamily: language === 'Dzo' ? 'joyig' : undefined,
      fontSize: getFontSize(language === 'Dzo' ? height * 0.08 : height * 0.05),
      marginBottom: 5,
      marginTop: 5,
      textAlign: 'center',
    },
    modalDescription: {
      fontSize: getFontSize(language === 'Dzo' ? height * 0.06 : height * 0.04),
      fontFamily: language === 'Dzo' ? 'joyig' : undefined,
      textAlign: 'center',
      marginBottom: 5,
    },
    loadingText: {
      fontFamily: language === 'Dzo' ? 'joyig' : undefined,
      fontSize: getFontSize(16),
    },
    buttonText: {
      fontFamily: language === 'Dzo' ? 'joyig' : undefined,
      fontSize: getFontSize(language === 'Dzo' ? 22 : 16),
      color: 'white',
    },
    modalContent: {
      width: language === 'Dzo' ? '70%' : '60%',
      backgroundColor: 'white',
      borderRadius: 10,
      paddingVertical: language === 'Dzo' ? 15 : 12,
      paddingHorizontal: language === 'Dzo' ? 10 : 15,
      alignItems: 'center',
      position: 'relative',
    },
    notificationModalText: {
      fontFamily: language === 'Dzo' ? 'joyig' : undefined,
      fontSize: getFontSize(language === 'Dzo' ? 28 : 16),
      textAlign: 'center',
      marginBottom: 15,
      marginTop: 10,
      paddingHorizontal: 10,
    },
  });

  if (loading) {
    // Show loading indicator while data is being fetched
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/lottie_anime/cat_loading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={dynamicStyles.loadingText}>{getText('loading')}</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background_images/guided_bg.jpeg')}
      style={styles.background}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Guided')}>
          <Image
            source={require('../assets/icons/back_color.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarWindow}>
        <Image
          source={require('../assets/icons/avatarWindow.png')}
          style={styles.avatarWindowImage}
        />
        <View style={styles.container}>
          <FlatList
            data={avatarBorders}
            keyExtractor={item => item.id.toString()}
            numColumns={4}
            contentContainerStyle={styles.flatListStyle}
            renderItem={renderBorder}
          />
        </View>
      </View>

      {/* Avatar Details Modal */}
      {selectedBorder && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={dynamicStyles.modalContent}>
              {/* Close button (X) at top right */}
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>

              <Text style={dynamicStyles.modalTitle}>
                {getText(selectedBorder.nameKey)}
              </Text>
              <Image source={selectedBorder.image} style={styles.modalImage} />
              <Text style={dynamicStyles.modalDescription}>
                {language === 'Dzo'
                  ? `${getText('price')}${selectedBorder.cost}`
                  : `Price: ${selectedBorder.cost}`}
              </Text>
              <Text style={dynamicStyles.modalDescription}>
                {selectedBorder.is_purchased
                  ? getText('isPurchased')
                  : getText('notPurchased')}
              </Text>
              <View style={styles.modalButtons}>
                {!selectedBorder.is_purchased && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBuyBorder}>
                    <Text style={dynamicStyles.buttonText}>
                      {getText('buyButton')}
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedBorder.is_purchased &&
                  selectedBorder.id !== currentAvatarBorder && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.equipButton]}
                      onPress={handleEquipBorder}>
                      <Text style={dynamicStyles.buttonText}>
                        {getText('equipButton')}
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Notification Modal (Replacement for Alert) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[dynamicStyles.modalContent, styles.notificationModal]}>
            <Text style={dynamicStyles.notificationModalText}>
              {notificationMessage}
            </Text>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setNotificationModalVisible(false)}>
              <Text style={[dynamicStyles.buttonText, {color: 'white'}]}>
                {getText('okay')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    position: 'absolute',
    top: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  avatarWindow: {
    width: width * 0.6,
    height: height * 0.6,
    padding: 10,
    marginBottom: height * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWindowImage: {
    position: 'absolute',
    width: '110%',
    height: '150%',
    resizeMode: 'stretch',
  },
  flatListStyle: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    width: '100%',
    height: '100%',
    marginTop: '8%',
  },
  avatarContainer: {
    margin: 5,
    width: (width * 0.6) / 4 - 20,
    height: (height * 0.6) / 3 - 10,
    backgroundColor: '#64748B',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  purchasedBorder: {
    borderColor: 'gold',
    borderWidth: 2,
  },
  unpurchasedBorder: {
    opacity: 0.5,
  },
  borderName: {
    marginTop: 5,
    fontSize: 16,
  },
  borderCost: {
    fontSize: 14,
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 5,
  },
  actionButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    minWidth: 70,
    alignItems: 'center',
  },
  equipButton: {
    backgroundColor: '#28A745',
  },
  equippedBorder: {
    borderColor: '#80EF80',
    borderWidth: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  closeIcon: {
    position: 'absolute',
    top: 5,
    right: 10,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  notificationModal: {
    width: '80%',
    maxWidth: 350,
    minWidth: 250,
    padding: 15,
  },
  notificationButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 25,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
});

export default AvatarScreen;
