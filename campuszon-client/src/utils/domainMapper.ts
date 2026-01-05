// Domain to organization name mapping
const domainMap: { [key: string]: string } = {
  // IIT Institutions
  'iitism.ac.in': 'IIT (ISM) Dhanbad',
  'iitkgp.ac.in': 'IIT Kharagpur',
  'iitb.ac.in': 'IIT Bombay',
  'iitd.ac.in': 'IIT Delhi',
  'iitm.ac.in': 'IIT Madras',
  'iitk.ac.in': 'IIT Kanpur',
  'iitr.ac.in': 'IIT Roorkee',
  'iitg.ac.in': 'IIT Guwahati',
  'iith.ac.in': 'IIT Hyderabad',
  'iiti.ac.in': 'IIT Indore',
  'iitbhu.ac.in': 'IIT BHU Varanasi',
  'iitbbs.ac.in': 'IIT Bhubaneswar',
  'iitgn.ac.in': 'IIT Gandhinagar',
  'iitj.ac.in': 'IIT Jodhpur',
  'iitpkd.ac.in': 'IIT Palakkad',
  'iittp.ac.in': 'IIT Tirupati',
  'iitdh.ac.in': 'IIT Dharwad',
  'iitbhilai.ac.in': 'IIT Bhilai',
  'iitgoa.ac.in': 'IIT Goa',
  'iitjammu.ac.in': 'IIT Jammu',
  'iitpatna.ac.in': 'IIT Patna',
  'iitrpr.ac.in': 'IIT Ropar',
  'iitmandi.ac.in': 'IIT Mandi',
  
  // NITs
  'nitdgp.ac.in': 'NIT Durgapur',
  'nitt.edu': 'NIT Trichy',
  'nitw.ac.in': 'NIT Warangal',
  'nitk.ac.in': 'NIT Karnataka',
  'nitrr.ac.in': 'NIT Raipur',
  'nits.ac.in': 'NIT Silchar',
  'nitrkl.ac.in': 'NIT Rourkela',
  'nitj.ac.in': 'NIT Jalandhar',
  'nitsri.ac.in': 'NIT Srinagar',
  'nita.ac.in': 'NIT Agartala',
  'nitap.ac.in': 'NIT Arunachal Pradesh',
  'nitc.ac.in': 'NIT Calicut',
  'nitdel.ac.in': 'NIT Delhi',
  'nitgoa.ac.in': 'NIT Goa',
  'nith.ac.in': 'NIT Hamirpur',
  'nitjsr.ac.in': 'NIT Jamshedpur',
  'nitkurukshetra.ac.in': 'NIT Kurukshetra',
  'nitm.ac.in': 'NIT Manipur',
  'nitmeg.ac.in': 'NIT Meghalaya',
  'nitmz.ac.in': 'NIT Mizoram',
  'nitnagaland.ac.in': 'NIT Nagaland',
  'nitpy.ac.in': 'NIT Puducherry',
  'nituk.ac.in': 'NIT Uttarakhand',
  
  // IIITs
  'iiita.ac.in': 'IIIT Allahabad',
  'iiitb.ac.in': 'IIIT Bangalore',
  'iiitd.ac.in': 'IIIT Delhi',
  'iiitdm.ac.in': 'IIIT Design & Manufacturing',
  'iiitg.ac.in': 'IIIT Guwahati',
  'iiith.ac.in': 'IIIT Hyderabad',
  'iiitk.ac.in': 'IIIT Kota',
  'iiitl.ac.in': 'IIIT Lucknow',
  'iiitm.ac.in': 'IIIT Manipur',
  'iiitnr.ac.in': 'IIIT Nagpur',
  'iiitp.ac.in': 'IIIT Pune',
  'iiits.ac.in': 'IIIT Sricity',
  'iiitv.ac.in': 'IIIT Vadodara',
  
  // Other Universities
  'du.ac.in': 'Delhi University',
  'jnu.ac.in': 'Jawaharlal Nehru University',
  'bits-pilani.ac.in': 'BITS Pilani',
  'vit.ac.in': 'VIT Vellore',
  'vitap.ac.in': 'VIT AP',
  'vitbhopal.ac.in': 'VIT Bhopal',
  'manipal.edu': 'Manipal Institute of Technology',
  'thapar.edu': 'Thapar Institute of Engineering',
  'dtu.ac.in': 'Delhi Technological University',
  'nsut.ac.in': 'NSUT Delhi',
  'iisc.ac.in': 'Indian Institute of Science Bangalore',
  'bhu.ac.in': 'Banaras Hindu University',
  'amu.ac.in': 'Aligarh Muslim University',
  'annauniv.edu': 'Anna University',
  'jadavpur.edu.in': 'Jadavpur University',
  
  // International Universities (for testing)
  'mit.edu': 'Massachusetts Institute of Technology',
  'stanford.edu': 'Stanford University',
  'harvard.edu': 'Harvard University',
  'berkeley.edu': 'UC Berkeley',
  'caltech.edu': 'California Institute of Technology',
  'ox.ac.uk': 'University of Oxford',
  'cam.ac.uk': 'University of Cambridge',
};

/**
 * Get organization name from email domain
 * If domain not found, returns a formatted version of the domain
 */
export const getOrganizationName = (email: string): string => {
  if (!email) return 'Campus';
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'Campus';
  
  // Check if domain exists in our map
  if (domainMap[domain]) {
    return domainMap[domain];
  }
  
  // If not found, create a readable name from domain
  // e.g., "example.edu" -> "Example University"
  const domainParts = domain.split('.');
  const mainPart = domainParts[0];
  
  // Capitalize first letter
  const formatted = mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  
  // Check if it's an educational domain
  if (domain.includes('.edu') || domain.includes('.ac.')) {
    return `${formatted} University`;
  }
  
  return formatted;
};

/**
 * Get email domain from email address
 */
export const getEmailDomain = (email: string): string => {
  if (!email) return '';
  return email.split('@')[1]?.toLowerCase() || '';
};
