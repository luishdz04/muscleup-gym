import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Opcional: Registrar fuentes
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
// });

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  text: {
    fontSize: 12,
    marginBottom: 3,
  },
  rule: {
    fontSize: 10,
    marginBottom: 2,
  },
  ruleSection: {
    marginBottom: 15,
  },
  signature: {
    marginTop: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  signatureImage: {
    width: 200,
    height: 80,
    objectFit: 'contain',
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    fontSize: 10,
  },
});

// Componente del PDF
export const ContractPDF = ({ userData, address, emergency, membership }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Muscle Up Gym - Contrato de Membresía</Text>
      
      {/* Información Personal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <Text style={styles.text}>Nombre: {userData.firstName} {userData.lastName}</Text>
        <Text style={styles.text}>Email: {userData.email}</Text>
        <Text style={styles.text}>WhatsApp: {userData.whatsapp}</Text>
        <Text style={styles.text}>Fecha de Nacimiento: {new Date(userData.birthDate).toLocaleDateString()}</Text>
        <Text style={styles.text}>Género: {userData.gender}</Text>
      </View>
      
      {/* Dirección */}
      {address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección</Text>
          <Text style={styles.text}>{address.street} {address.number}, {address.neighborhood}</Text>
          <Text style={styles.text}>{address.city}, {address.state}, {address.postalCode}</Text>
          <Text style={styles.text}>{address.country}</Text>
        </View>
      )}
      
      {/* Contacto de Emergencia */}
      {emergency && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          <Text style={styles.text}>Nombre: {emergency.name}</Text>
          <Text style={styles.text}>Teléfono: {emergency.phone}</Text>
          <Text style={styles.text}>Condición Médica: {emergency.medicalCondition}</Text>
          <Text style={styles.text}>Tipo de Sangre: {emergency.bloodType}</Text>
        </View>
      )}
      
      {/* Información de Membresía */}
      {membership && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Membresía</Text>
          <Text style={styles.text}>Referido por: {membership.referredBy}</Text>
          <Text style={styles.text}>Motivación principal: {membership.mainMotivation}</Text>
          <Text style={styles.text}>Nivel de entrenamiento: {membership.trainingLevel}</Text>
        </View>
      )}
      
      {/* Reglamento */}
      <View style={styles.ruleSection}>
        <Text style={styles.sectionTitle}>Reglamento de Muscle Up Gym</Text>
        <Text style={styles.rule}>1. El uso de toalla es obligatorio en todas las áreas del gimnasio.</Text>
        <Text style={styles.rule}>2. Debes colocar el equipo en su lugar después de utilizarlo.</Text>
        <Text style={styles.rule}>3. No se permite el ingreso con alimentos o bebidas que no sean agua.</Text>
        <Text style={styles.rule}>4. Está prohibido el uso de lenguaje ofensivo o comportamiento inadecuado.</Text>
        <Text style={styles.rule}>5. El uso de celulares debe ser moderado y sin interrumpir a otros usuarios.</Text>
        <Text style={styles.rule}>6. La credencial de membresía es personal e intransferible.</Text>
        <Text style={styles.rule}>7. No se permiten pertenencias personales en las áreas de entrenamiento.</Text>
        <Text style={styles.rule}>8. El gimnasio no se hace responsable por objetos extraviados o robados.</Text>
        <Text style={styles.rule}>9. El pago de la mensualidad debe realizarse dentro de los primeros 5 días del mes.</Text>
        <Text style={styles.rule}>10. El incumplimiento del reglamento puede resultar en la cancelación de la membresía sin reembolso.</Text>
      </View>
      
      {/* Firma */}
      <View style={styles.signature}>
        <Text>He leído y acepto el reglamento anterior:</Text>
        {userData.signatureUrl ? (
          <Image src={userData.signatureUrl} style={styles.signatureImage} />
        ) : (
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Firma</Text>
          </View>
        )}
        <Text style={styles.signatureName}>{userData.firstName} {userData.lastName}</Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text>Fecha de registro: {new Date().toLocaleDateString()}</Text>
        <Text>ID de membresía: {userData.id}</Text>
      </View>
    </Page>
  </Document>
);