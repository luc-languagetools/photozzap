
// configuration for dev

UPLOADCARE_PUBLIC_KEY = '071cc18cd47faf518850';

$.cloudinary.config({ cloud_name: 'photozzap', api_key: '751779366151643'});

conferenceModule.constant("photozzapConfig", {firebaseRoot:"https://fiery-fire-5557.firebaseio.com",
                                              serverName:"dev-02",
                                              environment:"dev",
                                              firstNode:"photozzap",
                                              conferenceUrlTemplate:"http://dev2.photozzap.com:8000/conference.html#/confkey",
                                              permanentUrlTemplate:"http://dev2.photozzap.com:8000/conference.html#/confkey"});
                                              



