import React, { Component } from 'react';
import {
	View,
	Text,
	StyleSheet,
	SafeAreaView,
	ScrollView,
	Alert,
	Dimensions,
	PermissionsAndroid,
	Image,
	BackHandler, 
	Platform
} from 'react-native';
import { Card, CardItem } from 'native-base';
import ImagePicker from 'react-native-image-picker';
import axiosCloudinary from 'axios';
import AsyncStorage from '@react-native-community/async-storage';
import Communications from 'react-native-communications';
import Permissions from 'react-native-permissions';
import HeaderToolbar from '../../components/HeaderToolbar/HeaderToolbar';
import StatusBar from '../../UI/StatusBar/StatusBar';
import Ubicacion from '../../components/Incidencias/Ubicacion/Ubicacion';
import Multimedia from '../../components/Incidencias/Multimedia/Multimedia';
import Descripcion from '../../components/Incidencias/Descripcion/Descripcion';
import DatosPersonales from '../../components/Incidencias/DatosPersonales/DatosPersonales';
import CustomButton from '../../components/CustomButton/CustomButton';
import axios from '../../../axios-ayuntamiento';
import CustomCardItemTitle from '../../components/CustomCardItemTitle/CustomCardItemTitle';
import CustomSpinner from '../../components/CustomSpinner/CustomSpinner';
import Incidencia from '../../components/Incidencias/Incidencia';
import CustomAddBanner from '../../components/CustomAddBanner/CustomAddBanner';
import KBAvoiding from '../../components/KBAvoiding/KBAvoiding';

export default class Incidencias extends Component {
	_didFocusSubscription;
	_willBlurSubscription;

	state = {
		formDescripcion: {
			asunto: {
				itemType: 'FloatingLabel',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 100
				},
				valid: false
			},
			direccion: {
				itemType: 'Picker',
				value: 'Reglamentos',
				valid: true
			},
			descripcion: {
				itemType: 'Textarea',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 1500
				},
				valid: false
			}
		},
		formDatosPersonales: {
			nombre: {
				itemType: 'FloatingLabel',
				value: '',
				holder: 'Nombre',
				validation: {
					minLength: 1,
					maxLength: 100
				},
				valid: false
			},
			email: {
				itemType: 'FloatingLabel',
				value: '',
				holder: 'Email',
				validation: {
					required: true,
					email: true
				},
				valid: false
			},
			telefono: {
				itemType: 'FloatingLabel',
				value: '',
				holder: 'Telefono',
				validation: {
					minLength: 7,
					maxLength: 10
				},
				valid: false
			}
		},
		formMultimedia: {
			imagen: {
				itemType: 'ImageButton',
				value: '',
				holder: 'IMAGEN',
				valid: true
			}
		},
		formApproved: {
			approved: {
				value: false
			}
		},
		formUbicacion: {
			calle: {
				itemType: 'FloatingLabel',
				label: 'CALLE',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 150
				},
				valid: false
			},
			numero: {
				itemType: 'FloatingLabel',
				label: 'NUMERO',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 20
				},
				valid: false
			},
			colonia: {
				itemType: 'FloatingLabel',
				label: 'COLONIA',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 150
				},
				valid: false
			},
			cp: {
				itemType: 'FloatingLabel',
				label: 'CP',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 15
				},
				valid: false
			},
			localidad: {
				itemType: 'FloatingLabel',
				label: 'LOCALIDAD',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 150
				},
				valid: false
			},
			referencia: {
				itemType: 'FloatingLabel',
				label: 'REFERENCIA',
				value: '',
				validation: {
					minLength: 1,
					maxLength: 150
				},
				valid: false
			}
		},
		formUbicacionIsValid: false,
		formDescripcionIsValid: false,
		formDatosPersonalesIsValid: false,
		loading: false,
		options: {
			title: 'Elige una opción',
			takePhotoButtonTitle: 'Abrir camara.',
			chooseFromLibraryButtonTitle: 'Abrir galeria.',
			maxWidth: 800,
			maxHeight: 800
		},
		incidentImage: null,
		fileNameImage: null,
		imageFormData: null,
		date: null,
		token: null,
		addIncident: null,
		incidents: [],
		isAdmin: null,
		urlUploadedImage: null,
		showButtons: true,
		showLikeIcons: true,
		texToSearch: '',
		typeOfLocation: 'Dirección específica',
		showMap: false,
		latitude: null,
        longitude: null,
		search: false,
		requestiOSLocation: null,
	};

	constructor(props) {
		super(props);
		this._didFocusSubscription = props.navigation.addListener('didFocus', (payload) =>
			BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
		);
	};

	//Style of drawer navigation
	static navigationOptions = {
		drawerLabel: () => (<Text style={styles.drawerLabel}>Reporte Ciudadano</Text>),
		drawerIcon: ({ tintColor }) => (
			<Image
				source={require('../../assets/images/Drawer/report.png')}
				style={styles.drawerIcon}
				resizeMode="contain"
			/>
		)
	};

	getCurrentDate() {
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth() + 1; //January is 0!
		var yyyy = today.getFullYear();

		if (dd < 10) {
			dd = '0' + dd;
		}

		if (mm < 10) {
			mm = '0' + mm;
		}

		today = mm + '/' + dd + '/' + yyyy;
		this.setState({ date: today });
	}

	async componentDidMount() {
		//BackHandler
		this._willBlurSubscription = this.props.navigation.addListener('willBlur', (payload) =>
			BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid)
		);
		//Get the token and time of expiration
		this.getCurrentDate();
		Platform.OS === 'android' ? this.requestLocationPermission() :  this.requestLocationPermissioniOS();
		let token = (email = expiresIn = null);
		try {
			console.log('Entro al try');
			token = await AsyncStorage.getItem('@storage_token');
			expiresIn = await AsyncStorage.getItem('@storage_expiresIn');
			email = await AsyncStorage.getItem('@storage_email');
			//Use the expires in
			const parseExpiresIn = new Date(parseInt(expiresIn));
			const now = new Date();
			//console.log('Incidencias.js: ', token);
			//console.log('Incidencias.js: ', parseExpiresIn, now);
			//console.log('Incidencias.js: ', this.state.tokenIsValid);
			//console.log('Incidencias.js: ', email);
			if (token && parseExpiresIn > now) {
				this.setState({ token: token });

				if (email !== 'false') this.setState({ isAdmin: true });
				else this.setState({ isAdmin: false });

				this.getIncidents();
			} else {
				//Restrict screens if there's no token
				try {
					console.log('Entro al try');
					await AsyncStorage.removeItem('@storage_token');
					await AsyncStorage.removeItem('@storage_expiresIn');
					//Use the expires in
				} catch (e) {
					//Catch posible errors
				}
				Alert.alert(
					'Incidencias',
					'¡Tiempo de espera agotado, inicie sesion de nuevo!',
					[ { text: 'Ok', onPress: () => this.props.navigation.navigate('Auth') } ],
					{ cancelable: false }
				);
			}
		} catch (e) {
			//Catch posible errors
		}
	};

	onBackButtonPressAndroid = () => {
		const { openDrawer, closeDrawer, dangerouslyGetParent } = this.props.navigation;
		const parent = dangerouslyGetParent();
		const isDrawerOpen = parent && parent.state && parent.state.isDrawerOpen;

		if (!this.state.search && !this.state.addIncident) {
			if (isDrawerOpen) closeDrawer();
			else openDrawer();
		}

		if (this.state.search)
			this.startSearch();
		
		if (this.state.addIncident)
			this.setState({ addIncident: false });
				
		return true;
	};

	componentWillUnmount() {
		this._didFocusSubscription && this._didFocusSubscription.remove();
		this._willBlurSubscription && this._willBlurSubscription.remove();
	};
	
	findLocationHandler = () => {
		//Check ios permission in info.plist it's nor working
		//Continue here
		this.watchId = navigator.geolocation.watchPosition(
			(position) => {
				console.log('position: ', position);
				 this.setState({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				});
			 },
			 (error) => {
				 console.log('Error: ', error);
			 },
			 {
				 enableHighAccuracy: false,
				 timeout: 1,
				 distanceFilter: 1
			 }
		 );		
    };
    

	requestLocationPermission = async () => {
		try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                'title': 'Location Permission',
                'message': 'You need location permissions to this app '
              }
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              console.log("You can use the location")
              this.findLocationHandler();
            } else {
              console.log("Location permission denied")
            }
          } catch (err) {
            console.warn(err)
          }
	};

	requestLocationPermissioniOS = () => {
		// this.watchId = navigator.geolocation.requestAuthorization();
		Permissions.check('location', {type: 'always'}).then(response => {
			console.log('check', response);
			if (response === 'authorized') {
				this.setState({ requestiOSLocation:  true });
				this.findLocationHandler()
			} else {
				this.setState({ requestiOSLocation:  false });
			}
		  });
	};

	sendIncidentHandler = () => {
		this.setState({ loading: true });
		if (
			this.state.imageFormData &&
			this.state.formDescripcionIsValid &&
			this.state.formDatosPersonalesIsValid &&
			this.state.formUbicacionIsValid
		) {
			const ubicacionFormData = {};
			const descripcionFormData = {};
			const datosPersonalesFormData = {};
			const approvedFormData = {};

			if (!this.state.showMap) {
				for (let formElementIdentifier in this.state.formUbicacion) {
					ubicacionFormData[formElementIdentifier] = this.state.formUbicacion[formElementIdentifier].value;
				}
			} else {
				ubicacionFormData['latitude'] = this.state.latitude;
				ubicacionFormData['longitude'] = this.state.longitude;
				ubicacionFormData['fecha'] = this.state.date;
			}
			for (let formElementIdentifier in this.state.formDescripcion) {
				descripcionFormData[formElementIdentifier] = this.state.formDescripcion[formElementIdentifier].value;
			}
			for (let formElementIdentifier in this.state.formDatosPersonales) {
				datosPersonalesFormData[formElementIdentifier] = this.state.formDatosPersonales[
					formElementIdentifier
				].value;
			}
			for (let formElementIdentifier in this.state.formApproved) {
				approvedFormData[formElementIdentifier] = this.state.formApproved[formElementIdentifier].value;
			}

			const incident = {
				ubicacionData: ubicacionFormData,
				descripcionData: descripcionFormData,
				personalData: datosPersonalesFormData,
				multimediaData: {
					imagen: this.state.urlUploadedImage
				},
				approvedData: approvedFormData
			};

			const { token } = this.state;
			axios
				.post('/incidents.json?auth=' + token, incident)
				.then((response) => {
					this.setState({ loading: false });
					Alert.alert(
						'Reporte Ciudadano',
						'¡Reporte enviado con exito!',
						[ { text: 'Ok', onPress: () => this.getIncidents() } ],
						{ cancelable: false }
					);
				})
				.catch((error) => {
					this.setState({ loading: false });
					Alert.alert('Reporte Ciudadano', '¡Error al enviar incidencia!', [ { text: 'Ok' } ], {
						cancelable: false
					});
				});
		} else {
			this.setState({ loading: false });
			Alert.alert('Reporte Ciudadano', '¡Comlete el formulario correctamente!', [ { text: 'Ok' } ], {
				cancelable: false
			});
		}
	};

	checkValidity(value, rules) {
		let isValid = true;

		if (!rules) {
			return true;
		}

		if (rules.minLength) {
			isValid = value.length >= rules.minLength && isValid;
		}

		if (rules.maxLength) {
			isValid = value.length <= rules.maxLength && isValid;
		}

		if (rules.required) {
			isValid = value.trim() !== '' && isValid;
		}
		if (rules.email) {
			let valid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
			isValid = valid.test(value) && isValid;
		}

		return isValid;
	}
	inputChangeLocationHandler = (text, inputIdentifier) => {
		this.getCurrentDate();
		const updatedLocationForm = {
			...this.state.formUbicacion
		};
		const updatedFormElement = {
			...updatedLocationForm[inputIdentifier]
		};
		const updatedDateElement = {
			...updatedLocationForm['fecha']
		};

		updatedFormElement.value = text;
		updatedDateElement.value = this.state.date;
		updatedDateElement.valid = true;
		updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);

		updatedLocationForm[inputIdentifier] = updatedFormElement;
		updatedLocationForm['fecha'] = updatedDateElement;

		let formIsValid = true;

		for (let inputIdentifier in updatedLocationForm) {
			formIsValid = updatedLocationForm[inputIdentifier].valid && formIsValid;
		}
		this.setState({ formUbicacion: updatedLocationForm, formUbicacionIsValid: formIsValid });
	};
	typeOfLocation = (text) => {
		this.setState({ typeOfLocation: text }, () => {
			if (Platform.OS === 'android') {
				if (this.state.typeOfLocation === 'Su ubicación actual') {
					const updatedLocationForm = {
						...this.state.formUbicacion
					};
					for (let key in updatedLocationForm) {
						updatedLocationForm[key].valid = true;
					}
					this.setState({
						formUbicacion: updatedLocationForm,
						formUbicacionIsValid: true,
						showMap: true
					});
				} else {
					const updatedLocationForm = {
						...this.state.formUbicacion
					};
					for (let key in updatedLocationForm) {
						updatedLocationForm[key].valid = false;
					}
					this.setState({
						formUbicacion: updatedLocationForm,
						formUbicacionIsValid: false,
						showMap: false
					});
				}
			} else {
				if (this.state.requestiOSLocation && this.state.typeOfLocation === 'Su ubicación actual') {
					const updatedLocationForm = {
						...this.state.formUbicacion
					};
					for (let key in updatedLocationForm) {
						updatedLocationForm[key].valid = true;
					}
					this.setState({
						formUbicacion: updatedLocationForm,
						formUbicacionIsValid: true,
						showMap: true
					});
				} else {
					this.setState({ typeOfLocation: 'Dirección específica' })
					!this.state.requestiOSLocation && Alert.alert(
						'Reporte', 
						'Active su ubicación GPS', 
						[ 
							{ text: 'Si', }, 
							{ text: 'No', }, 
						], 
						{
							cancelable: false
						},
					);
					const updatedLocationForm = {
						...this.state.formUbicacion
					};
					for (let key in updatedLocationForm) {
						updatedLocationForm[key].valid = false;
					}
					this.setState({
						formUbicacion: updatedLocationForm,
						formUbicacionIsValid: false,
						showMap: false
					});
				}
			}
		});
	};
	inputChangeDescriptionHandler = (text, inputIdentifier) => {
		const updatedDescriptionForm = {
			...this.state.formDescripcion
		};
		const updatedFormElement = {
			...updatedDescriptionForm[inputIdentifier]
		};

		updatedFormElement.value = text;
		updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);

		updatedDescriptionForm[inputIdentifier] = updatedFormElement;

		let formIsValid = true;

		for (let inputIdentifier in updatedDescriptionForm) {
			formIsValid = updatedDescriptionForm[inputIdentifier].valid && formIsValid;
		}
		this.setState({ formDescripcion: updatedDescriptionForm, formDescripcionIsValid: formIsValid });
	};
	inputChangePersonalDataHandler = (text, inputIdentifier) => {
		const updatedPersonalDataForm = {
			...this.state.formDatosPersonales
		};
		const updatedFormElement = {
			...updatedPersonalDataForm[inputIdentifier]
		};

		updatedFormElement.value = text;
		updatedFormElement.valid = this.checkValidity(updatedFormElement.value, updatedFormElement.validation);

		updatedPersonalDataForm[inputIdentifier] = updatedFormElement;

		let formIsValid = true;

		for (let inputIdentifier in updatedPersonalDataForm) {
			formIsValid = updatedPersonalDataForm[inputIdentifier].valid && formIsValid;
		}
		this.setState({ formDatosPersonales: updatedPersonalDataForm, formDatosPersonalesIsValid: formIsValid });
	};
	loadPhotoHandler = (show) => {
		if (show === 'library') {
			ImagePicker.launchImageLibrary(this.state.options, (response) => {
				console.log('Response = ', response);

				if (response.didCancel) {
					console.log('User cancelled image picker');
				} else if (response.error) {
					console.log('ImagePicker Error: ', response.error);
				} else {
					//Preset
					const UPLOAD_PRESET_NAME = 'ayuntamiento';
					const { fileName, fileSize, type, data, uri } = response;
					//Image form data
					const imageFormData = new FormData();
					imageFormData.append('file', {
						name: fileName,
						size: fileSize,
						type: type,
						data: data,
						uri: uri
					});
					imageFormData.append('upload_preset', UPLOAD_PRESET_NAME);
					this.setState({
						incidentImage: { uri: uri },
						fileNameImage: response.fileName,
						imageFormData: imageFormData
					});
				}
			});
		} else {
			ImagePicker.launchCamera(this.state.options, (response) => {
				console.log('Response = ', response);

				if (response.didCancel) {
					console.log('User cancelled image picker');
				} else if (response.error) {
					console.log('ImagePicker Error: ', response.error);
				} else {
					//Preset
					const UPLOAD_PRESET_NAME = 'ayuntamiento';
					const { fileName, fileSize, type, data, uri } = response;
					//Image form data
					const imageFormData = new FormData();
					imageFormData.append('file', {
						name: fileName,
						size: fileSize,
						type: type,
						data: data,
						uri: uri
					});
					imageFormData.append('upload_preset', UPLOAD_PRESET_NAME);
					this.setState({
						incidentImage: { uri: uri },
						fileNameImage: response.fileName,
						imageFormData: imageFormData
					});
				}
			});
		}
	};
	//Get incidents
	getIncidents = () => {
		this.setState({ loading: true, addIncident: false, showButtons: true });
		axios
			.get('/incidents.json?auth=' + this.state.token)
			.then((res) => {
				const fetchedIncidents = [];
				for (let key in res.data) {
					fetchedIncidents.push({
						...res.data[key],
						id: key
					});
				}
				if (this.state.isAdmin) {
					this.setState({ loading: false, incidents: fetchedIncidents.reverse() });
				} else {
					let ban = false;
					const filterData = fetchedIncidents.filter((incdt) => {
						const approved = incdt.approvedData['approved'];
						if (approved) {
							ban = true;
							return incdt;
						}
					});
					if (ban) {
						this.setState({ loading: false, incidents: filterData.reverse() });
					}
					if (!ban) this.setState({ loading: false, incidents: [] });
				}
			})
			.catch((err) => {
				this.setState({ loading: false });
			});
	};

	uploadPhotoHandler = () => {
		//URL cloudinary
		const URL_CLOUDINARY = 'https://api.cloudinary.com/v1_1/storage-images/image/upload';
		this.setState({ loading: true });
		console.log(
			'Form: ',
			this.state.imageFormData,
			this.state.formDatosPersonales,
			this.state.formDatosPersonalesIsValid,
			this.state.formDescripcion,
			this.state.formDescripcionIsValid,
			this.state.formUbicacion,
			this.state.formUbicacionIsValid
		);
		if (
			this.state.imageFormData &&
			this.state.formDatosPersonalesIsValid &&
			this.state.formDescripcionIsValid &&
			this.state.formUbicacionIsValid
		) {
			axiosCloudinary({
				url: URL_CLOUDINARY,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				data: this.state.imageFormData
			})
				.then((response) => {
					console.log('ResponseCloudinary: ', response);
					//Destructurin response
					const { data } = response;
					console.log('ResponseDataCloudinary: ', data);
					//Destructuring data
					const { url, eager } = data;
					//Send to state url response
					this.setState({ urlUploadedImage: url });
					console.log('stateofForm: ', this.state.form);
					//Call the method to upload new
					this.sendIncidentHandler();
				})
				.catch((err) => {
					this.setState({ loading: false });
					Alert.alert('Actividades', 'Imagen fallida al enviar!', [ { text: 'Ok' } ], {
						cancelable: false
					});
					console.log('ErrorCloudinary: ', err);
				});
		} else {
			this.setState({ loading: false });
			Alert.alert('Actividades', '¡Complete el formulario correctamente!', [ { text: 'Ok' } ], {
				cancelable: false
			});
		}
	};

	changeDisplay = () => {
		this.setState({ showLikeIcons: !this.state.showLikeIcons });
	};
	searchTextHandler = (text) => {
		this.setState({ texToSearch: text }, () => this.filterData(this.state.texToSearch));
	};
	filterData = (text) => {
		if (text !== '') {
			let ban = false;
			const filteredIncidents = this.state.incidents.filter((incdt) => {
				const filterIncident = incdt.descripcionData['asunto'];
				const filterDate = incdt.ubicacionData['fecha'];
				console.log('filterNew: ', filterIncident);
				console.log('filterDate: ', filterDate);
				if (filterIncident.includes(text) || filterDate.includes(text)) {
					ban = true;
					return incdt;
				}
			});
			if (ban) {
				this.setState({ incidents: filteredIncidents });
			}
		} else this.getIncidents();
	};
	startSearch = () => {
		this.setState({ search: !this.state.search });
	};

	render() {
		// console.log('type: ', this.state.typeOfLocation, 'showMap: ', this.state.showMap, 'ubicationForm: ', this.state.formUbicacion, 'ubicacionisValid: ', this.state.formUbicacionIsValid)
		const formElementsUbicacion = [];
		for (let key in this.state.formUbicacion) {
			formElementsUbicacion.push({
				id: key,
				config: this.state.formUbicacion[key]
			});
		}
		const formElementsDescripcion = [];
		for (let key in this.state.formDescripcion) {
			formElementsDescripcion.push({
				id: key,
				config: this.state.formDescripcion[key]
			});
		}
		const formElementsDatosPersonales = [];
		for (let key in this.state.formDatosPersonales) {
			formElementsDatosPersonales.push({
				id: key,
				config: this.state.formDatosPersonales[key]
			});
		}
		const formElementsMultimedia = [];
		for (let key in this.state.formMultimedia) {
			formElementsMultimedia.push({
				id: key,
				config: this.state.formMultimedia[key]
			});
		}

		const specificLocation = formElementsUbicacion.map((element) => (
			<Ubicacion
				key={element.id}
				itemType={element.config.itemType}
				label={element.config.label}
				value={element.config.value}
				isValid={element.config.valid}
				changed={(text) => this.inputChangeLocationHandler(text, element.id)}
			/>
		));

		const currentLocation = (
			<Ubicacion
				key="MapView"
				itemType="MapView"
				latitude={this.state.latitude}
				longitude={this.state.longitude}
			/>
		);

		const ubicacion = (
			<View style={{ flex: 1, marginBottom: 5 }}>
				<View style={styles.addView}>
					<Text style={styles.addTextDesc}>Ubicacion del reporte o queja</Text>
				</View>
				<CardItem bordered>
					<View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
						<Ubicacion
							key="selectTypeUbication"
							itemType="SelectDirection"
							value={this.state.typeOfLocation}
							changed={Platform.OS === 'android' ? (text) => {
								this.state.latitude
									? this.typeOfLocation(text)
									: alert('Active su ubicación GPS y reinicie la app para usar su ubicación actual');
							} : this.typeOfLocation}
						/>

						{this.state.showMap ? (
							this.state.latitude && this.state.longitude && currentLocation
						) : (
							specificLocation
						)}
					</View>
				</CardItem>
			</View>
		);
		const multimedia = (
			<View style={{ flex: 1, marginBottom: 5 }}>
				<View style={styles.addView}>
					<Text style={styles.addTextDesc}>Foto a reportar.</Text>
				</View>
				<CardItem bordered>
					<View style={{ flex: 1, flexDirection: 'column' }}>
						{formElementsMultimedia.map((element) => (
							<Multimedia
								key={element.id}
								itemType={element.config.itemType}
								holder={element.config.holder}
								loadPhoto={this.loadPhotoHandler}
								image={this.state.incidentImage}
								name={this.state.fileNameImage}
							/>
						))}
					</View>
				</CardItem>
			</View>
		);
		const description = (
			<View style={{ flex: 1, marginBottom: 5 }}>
				<View style={styles.addView}>
					<Text style={styles.addTextDesc}>Asunto, departamento y descripción.</Text>
				</View>
				<CardItem bordered>
					<View style={{ flex: 1, flexDirection: 'column' }}>
						{formElementsDescripcion.map((element) => (
							<Descripcion
								key={element.id}
								itemType={element.config.itemType}
								value={element.config.value}
								isValid={this.state.formDescripcionIsValid}
								changed={(text) => this.inputChangeDescriptionHandler(text, element.id)}
							/>
						))}
					</View>
				</CardItem>
			</View>
		);
		const datosPersonales = (
			<View style={{ flex: 1, marginBottom: 5 }}>
				<View style={styles.addView}>
					<Text style={styles.addTextDesc}>Datos personales.</Text>
				</View>
				<CardItem bordered>
					<View style={{ flex: 1, flexDirection: 'column' }}>
						{formElementsDatosPersonales.map((element) => (
							<DatosPersonales
								key={element.id}
								itemType={element.config.itemType}
								value={element.config.value}
								holder={element.config.holder}
								isValid={this.state.formDatosPersonalesIsValid}
								changed={(text) => this.inputChangePersonalDataHandler(text, element.id)}
							/>
						))}
					</View>
				</CardItem>
			</View>
		);

		const buttons = (
			<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center' }}>
				<CustomButton style="SuccessReport" clicked={() => this.uploadPhotoHandler()} name="ENVIAR REPORTE" />
				<CustomButton
					style="CallReport"
					clicked={() => Communications.phonecall('3714184000', true)}
					name="LLAMAR POR TEL."
				/>
			</View>
		);
		const spinner = <CustomSpinner color="blue" />;

		const addIncidentTitle = (
			<View style={{ flex: 1, marginBottom: 10, width: '100%' }}>
				<CustomAddBanner
					title="AGREGAR REPORTE"
					image={require('../../assets/images/Preferences/add-orange.png')}
				/>
			</View>
		);
		const addIncident = (
			<View style={{ flex: 1, flexDirection: 'column' }}>
				{addIncidentTitle}
				<Card style={styles.add}>
					<ScrollView style={{ flex: 1 }}>
						<CardItem bordered>
							<View style={styles.cardBody}>
								{description}
								{ubicacion}
								{multimedia}
								{datosPersonales}
								{this.state.loading ? spinner : buttons}
							</View>
						</CardItem>
					</ScrollView>
				</Card>
			</View>
		);
		const list = this.state.incidents.map((inct, index) => (
			<Incidencia
				key={inct.id}
				id={inct.id}
				token={this.state.token}
				isAdmin={this.state.isAdmin}
				refresh={this.getIncidents}
				approvedData={inct.approvedData}
				personalData={inct.personalData}
				descripcionData={inct.descripcionData}
				multimediaData={inct.multimediaData}
				ubicacionData={inct.ubicacionData}
				describe={this.props}
				index={index + 1}
				showLikeIcons={this.state.showLikeIcons}
			/>
		));
		const title = (
			<View style={{ marginBottom: 5, width: width * 0.94, height: width * 0.45 }}>
				<CustomCardItemTitle
					title="REPORTE CIUDADANO"
					description="Realice reportes de fallas en servicios y otras emergencias en su localidad."
					info="Escriba todos los campos que se presenta."
					image={require('../../assets/images/Preferences/incidents.png')}
				/>
			</View>
		);

		const body = (
			<Card style={{ flex: 2, flexDirection: 'column', justifyContent: 'flex-start' }}>
				<ScrollView style={{ flex: 1 }} contentContainerStyle={{ margin: 5, alignItems: 'center' }}>
					<View style={styles.cardBody}>
						{this.state.loading ? (
							spinner
						) : (
							<View style={this.state.showLikeIcons ? styles.scrollDataListIcons : styles.scrollDataList}>
								{list}
							</View>
						)}
					</View>
				</ScrollView>
			</Card>
		);
		const incidencias = (
			<View style={{ flex: 1 }}>
				{title}
				{body}
			</View>
		);

		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
				<View style={styles.container}>
					<View>
						<HeaderToolbar
							open={this.props}
							title="Reporte Ciudadano"
							color="#1dd2fc"
							showContentRight={true}
							titleOfAdd="Nuevo reporte"
							get={this.getIncidents}
							add={() => this.setState({ addIncident: true })}
							goBack={() => this.setState({ addIncident: false })}
							isAdd={this.state.addIncident}
							isAdmin={true}
							changeDisplay={this.changeDisplay}
							showLikeIcons={this.state.showLikeIcons}
							changed={(text) => this.searchTextHandler(text)}
							value={this.state.texToSearch}
							search={this.filterData}
							startSearch={this.startSearch}
							isSearch={this.state.search}
						/>
					</View>
					<StatusBar color="#00a3e4" />
					<KBAvoiding>
						<View style={{ flex: 1, margin: 10 }}>{!this.state.addIncident ? incidencias : addIncident}</View>
					</KBAvoiding>
				</View>
			</SafeAreaView>
		);
	}
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		flexWrap: 'wrap',
		overflow: 'scroll',
		backgroundColor: 'white',
	},
	view: {
		flex: 1
	},
	text: {
		fontSize: 20,
		fontWeight: 'bold'
	},
	body: {
		flex: 1,
		margin: 5
	},
	cardBody: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	btns: {
		flex: 1,
		flexDirection: 'column'
	},
	btn: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: '#F3F2F1',
		justifyContent: 'space-between',
		margin: 5,
		borderRadius: 5
	},
	scrollDataListIcons: {
		flex: 1,
		justifyContent: 'space-between',
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	scrollDataList: {
		flex: 1,
		justifyContent: 'space-between',
		flexDirection: 'column'
	},
	add: {
		flex: 2,
		flexDirection: 'column',
		justifyContent: 'flex-start'
	},
	addView: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: '#676766',
		marginRight: 5
	},
	addTextDesc: {
		fontSize: 15,
		fontWeight: 'normal',
		fontStyle: 'normal',
		color: 'white',
		fontFamily: 'AvenirNextLTPro-Regular'
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
