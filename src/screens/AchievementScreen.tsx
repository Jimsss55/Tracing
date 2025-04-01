import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import achievement from '../assets/achievements/achievementImages';
import {RootStackParamList} from '../types';
import {useNavigation, NavigationProp} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const AchievementScreen = () => {
  const avatars = Object.values(achievement);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      source={require('../assets/background_images/guided_bg.jpeg')}
      style={styles.background}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Guided')}>
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
            data={avatars}
            keyExtractor={(item, index) => index.toString()}
            numColumns={4}
            contentContainerStyle={styles.flatListStyle}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.avatarContainer}>
                <Image source={item} style={styles.avatarImage} />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
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
    width: '110 %',
    height: '150%',
    resizeMode: 'stretch',
  },
  flatListStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: '80%',
    resizeMode: 'contain',
  },
});

export default AchievementScreen;
