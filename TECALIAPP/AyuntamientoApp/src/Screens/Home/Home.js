import React, { Component } from 'react';
import {
	View,
	StyleSheet,
	Alert,
	SafeAreaView,
	ImageBackground,
	Dimensions,
	BackHandler,
	Image,
	Platform,
	Text
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
// import FCM, {
// 	NotificationActionType,
// 	RemoteNotificationResult,
// 	WillPresentNotificationResult,
// 	NotificationType,
// 	FCMEvent
// } from 'react-native-fcm';
import HeaderToolbar from '../../components/HeaderToolbar/HeaderToolbar';
import StatusBar from '../../UI/StatusBar/StatusBar';
import axios from '../../../axios-ayuntamiento';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import SwiperBanner from '../../components/SwiperBanner/SwiperBanner';
import { 
	checkMessagingPermission,
	requestMessagingPermission, 
	getTokenMessaging, 
	onNotificationListener, 
	onNotificationOpenedListener,
	getInitialNotification,
	onMessage,
} from '../../components/RNFBMessaging/RNFBMessaging';

export default class Home extends Component {
	_didFocusSubscription;
	_willBlurSubscription;
	_onNotificationListener;
	_notificationOpenedListener;
	_messageListener;

	state = {
		news: null,
		loading: false,
		token: null,
		refreshing: false,
		notificationToken: null,
		fcmTokens: [],
		allReadyToNotification: false,
		currentGif: require('../../assets/images/Gif/teca-centro1.gif'),
	};

	constructor(props) {
		super(props);
		this._didFocusSubscription = props.navigation.addListener('didFocus', (payload) =>
			BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
		);
	}

	//Style of drawer navigation
	static navigationOptions = {
		drawerLabel: () => (<Text style={styles.drawerLabel}>Home</Text>),
		drawerIcon: ({ tintColor }) => (
			<Image
				source={require('../../assets/images/Drawer/home-icon.png')}
				style={styles.drawerIcon}
				resizeMode="contain"
			/>
		),
	};

	checkmsgPermission = async () => {
		const checkPermissionResponse = await checkMessagingPermission();
		if (checkPermissionResponse) {
			const tokenMessaging = await getTokenMessaging();
			console.log('tokenMessaging: ', tokenMessaging);
			if (tokenMessaging){
				console.log('tokenMessagin true');
				this.setState({ notificationToken: tokenMessaging });
			}
		} else {
			const requestMssagngPermission = await requestMessagingPermission();
			console.log('requestMessagingPermission: ', requestMssagngPermission);
		}
	};

	createNotificationListener = async () => {
		this._onNotificationListener = onNotificationListener();
		console.log('_onNotificationListener', this._onNotificationListener);
		this._notificationOpenedListener = onNotificationOpenedListener();
		console.log('_notificationOpenedListener', this._notificationOpenedListener);
		const initialNotification = await getInitialNotification();
		console.log('initialNotification: ', initialNotification);
		this._messageListener = onMessage();
		console.log('_messageListener: ', this._messageListener);
	};

	//Obtiene el token y tiempo de expiracion almacenado globalmente en la app
	async componentDidMount() {
		// react-native-firebase
		this.checkmsgPermission();
		this.createNotificationListener();
		// react-native-firebase

		//Request lcoation permissons
		Platform.OS === 'ios' ? this.watchId = navigator.geolocation.requestAuthorization() : null;
		this.changeFirstGifHandler();
		//BackHandler
		this._willBlurSubscription = this.props.navigation.addListener('willBlur', (payload) =>
			BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
		);
		//Get the token and time of expiration
		let token = (expiresIn = email = null);
		try {
			// console.log('Entro al try');
			token = await AsyncStorage.getItem('@storage_token');
			expiresIn = await AsyncStorage.getItem('@storage_expiresIn');
			email = await AsyncStorage.getItem('@storage_email');
			//Use the expires in
			const parseExpiresIn = new Date(parseInt(expiresIn));
			const now = new Date();
			// console.log('Home.js: ', token);
			// console.log('Home.js: ', parseExpiresIn, now);
			// console.log('Home.js: ', email);
			if (token && parseExpiresIn > now) {
				this.setState({ token: token }, () => {this.getNews(); this.getFCMTokens()});
			} else {
				//Restrict screens if there's no token
				try {
					console.log('Entro al try');
					await AsyncStorage.removeItem('@storage_token');
					await AsyncStorage.removeItem('@storage_expiresIn');
					await AsyncStorage.removeItem('@storage_email');
					//Use the expires in
					Alert.alert(
						'Home',
						'¡Tiempo de espera agotado, inicie sesion de nuevo!',
						[ { text: 'Ok', onPress: () => this.props.navigation.navigate('Auth') } ],
						{ cancelable: false }
					);
				} catch (e) {
					//Catch posible errors
				}
			}
		} catch (e) {
			//Catch posible errors
		}
	};

	onBackButtonPressAndroid = () => {
		const { openDrawer, closeDrawer, dangerouslyGetParent } = this.props.navigation;
		const parent = dangerouslyGetParent();
		console.log('parent; ', parent);
		const isDrawerOpen = parent && parent.state && parent.state.isDrawerOpen;

		if (isDrawerOpen) closeDrawer();
		else openDrawer();
				
		return true;
	};

	componentWillUnmount() {
		this._didFocusSubscription && this._didFocusSubscription.remove();
		this._willBlurSubscription && this._willBlurSubscription.remove();

		clearTimeout(this.firstGif);
		clearTimeout(this.secondGif);
		clearTimeout(this.thirdGif);
		clearTimeout(this.fourthGif);
		clearTimeout(this.fifthGif);
	};

	//Get fcmTokens
	getFCMTokens = () => {
		// console.log('getting');
		const fetchedfcmTokens = [];
		axios
			.get('/fcmtokens.json?auth=' + this.state.token)
			.then((res) => {
				// console.log('gettingREs: ', res);
				for (let key in res.data) {
					fetchedfcmTokens.push({
						...res.data[key],
						id: key
					});
				}
				const fcmtkns = [];
				// console.log('exist tokens');
				for (let i = 0; i < fetchedfcmTokens.length; i++) {
					const element = fetchedfcmTokens[i];
					let fcmToken = element.tokenData[Object.keys(element.tokenData)];
					fcmtkns[i] = fcmToken;
				}
				// console.log('fcmtkns: ', fcmtkns);
				this.setState({ fcmTokens: fcmtkns }, () => this.verifyfcmTokens());
			})
			.catch((err) => {});

	};
	//Verify tokens
	verifyfcmTokens = () => {
		let exist = null;
		//Check if this token already exist in db
		if (this.state.fcmTokens.length !== 0) {
			for (let i = 0; i < this.state.fcmTokens.length; i++) {
				const element = this.state.fcmTokens[i];
				if (element == this.state.notificationToken) {
					exist = true;
				}
			}
		}

		if (this.state.fcmTokens.length === 0)
			exist = false;

		if (!exist) {
			const formData = {};
			formData['token' + Math.floor(Math.random() * 1000 + 1) + 'fcm'] = this.state.notificationToken;
			const fcmtoken = {
				tokenData: formData
			};
			axios
				.post('/fcmtokens.json?auth=' + this.state.token, fcmtoken)
				.then((response) => {
					// console.log('tokenRegistered!: ', response);
					this.getFCMTokens();
				})
				.catch((error) => {
					this.setState({ loading: false });
					console.log('cannot save token!');
				});
		}
		if (exist) this.setState({ allReadyToNotification: true });
	}; //end

	getNews = () => {
		//console.log('entro');
		this.setState({ loading: true });
		axios
			.get('/news.json?auth=' + this.state.token)
			.then((res) => {
				const fetchedNews = [];
				for (let key in res.data) {
					fetchedNews.push({
						...res.data[key],
						id: key
					});
				}
				this.setState({ loading: false, news: fetchedNews });
			})
			.catch((err) => {
				console.log(err);
				this.setState({ loading: true });
			});
	};

	changeFirstGifHandler = () => {
		this.firstGif = setTimeout(() => {
			this.setState({ currentGif: require('../../assets/images/Gif/teca-centro2.gif') }, () => this.changeSecondGifHandler())
		}, 10000);
	};

	changeSecondGifHandler = () => {
		this.secondGif = setTimeout(() => {
			this.setState({ currentGif: require('../../assets/images/Gif/teca-centro3.gif') }, () => this.changeThirdGifHandler())
		}, 10000);
	};

	changeThirdGifHandler = () => {
		this.thirdGif = setTimeout(() => {
			this.setState({ currentGif: require('../../assets/images/Gif/teca-centro4.gif') }, () => this.changeFourthGifHandler())
		}, 10000);
	};

	changeFourthGifHandler = () => {
		this.fourthGif = setTimeout(() => {
			this.setState({ currentGif: require('../../assets/images/Gif/teca-centro5.gif') }, () => this.changeFifthGifHandler())
		}, 10000);
	};

	changeFifthGifHandler = () => {
		this.fifthGif = setTimeout(() => {
			this.setState({ currentGif: require('../../assets/images/Gif/teca-centro1.gif') }, () => this.changeFirstGifHandler())
		}, 11000)
	};

	render() {
		const spinner = <CustomSpinner color="blue" />;
		const swiperBanner = <SwiperBanner news={this.state.news} open={this.props} token={this.state.token} />;

		return (
			<SafeAreaView style={styles.container}>
				<ImageBackground style={styles.view} source={this.state.currentGif}>
					<View>
						<HeaderToolbar open={this.props} title="Home" color="rgba(52, 52, 52, 0.8)" />
					</View>
					<StatusBar color="rgba(52, 52, 52, 0.8)" />
					<View style={{ flex: 1 }}>
						<View style={{ flex: 1 }}>{this.state.loading ? spinner : swiperBanner}</View>
					</View>
				</ImageBackground>
			</SafeAreaView>
		);
	}
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'black'
	},
	text: {
		justifyContent: 'center',
		alignItems: 'center',
		fontSize: 25
	},
	view: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'column',
		overflow: 'scroll'
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold'
	},
	drawerIcon: {
		height: width * 0.07,
		width: width * 0.07
	},
	drawerLabel: {
		width: width,
		marginLeft: 18,
		paddingBottom: 15,
		paddingTop: 15,
		color: '#676766',
		fontSize: 18,
		fontFamily: 'AvenirNextLTPro-Regular'
	}
});
