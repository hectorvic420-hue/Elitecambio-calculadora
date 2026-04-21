import React, { useState, useEffect } from 'react'; 
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Linking, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert, Pressable } from 'react-native'; 
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const COLORES = { bg: '#050505', surface: '#111111', border: '#222222', accent: '#E5E5E5', bcv: '#4fc3f7', textSec: '#A0A0A0', textMut: '#444444' }; 
const STORAGE_KEY_NUMERO = "@elite_cambios_config"; 
const PIN_SECRETO = "0831"; 

// ─── FORMATEADOR
function formatear(n, decimales) { 
  if (decimales === undefined) decimales = 2; 
  if (!n || isNaN(n) || n === 0) return decimales === 0 ? '0' : '0,00'; 
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }); 
} 

// ─── LIMPIADOR MAESTRO
function limpiarParaCalculo(input) { 
  if (!input) return 0; 
  let s = input.toString().replace(/\s/g, ''); 
  if (s.includes('.') && s.includes(',')) { 
    s = s.replace(/\./g, '').replace(',', '.'); 
    return parseFloat(s) || 0; 
  } 
  if (s.includes('.') && !s.includes(',')) { 
    const partes = s.split('.'); 
    const ultimaParte = partes[partes.length - 1]; 
    if (ultimaParte.length === 3) { 
      s = s.replace(/\./g, ''); 
      return parseFloat(s) || 0; 
    } 
    return parseFloat(s) || 0; 
  } 
  if (s.includes(',') && !s.includes('.')) { 
    s = s.replace(',', '.'); 
    return parseFloat(s) || 0; 
  } 
  return parseFloat(s) || 0; 
} 

export default function AppElite() { 
  const [moneda, setMoneda] = useState('COP'); 
  const [monto, setMonto] = useState(''); 
  const [tasa, setTasa] = useState(''); 
  const [tasaBCV, setTasaBCV] = useState(''); 
  const [cargando, setCargando] = useState(true); 
  const [wsNum, setWsNum] = useState('573017263268'); 
  const [modalPin, setModalPin] = useState(false); 
  const [pinIn, setPinIn] = useState(''); 
  const [modalCfg, setModalCfg] = useState(false); 
  const [nuevoNum, setNuevoNum] = useState(''); 

  // FUNCIÓN PARA REFRESCAR LA APP
  async function refreshApp() {
    setCargando(true);
    setMonto('');
    setTasa('');
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      const data = await res.json();
      const rate = data.promedio || 0;
      setTasaBCV(Number(rate).toFixed(2));
    } catch (e) {
      setTasaBCV('48.20');
      Alert.alert("Aviso", "No se pudo actualizar la tasa. Revisa tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(function() { 
    async function init() { 
      try { 
        const s = await AsyncStorage.getItem(STORAGE_KEY_NUMERO); 
        if (s) setWsNum(s); 
        await refreshApp();
      } catch (e) { setCargando(false); } 
    } 
    init(); 
  }, []); 

  const vMonto = limpiarParaCalculo(monto); 
  const vTasa = limpiarParaCalculo(tasa); 
  const vBCV = limpiarParaCalculo(tasaBCV); 

  let resCOP = 0, resBSD = 0, resUSD = 0; 
  if (vMonto > 0 && vBCV > 0) { 
    if (moneda === 'COP') { resCOP = vMonto; resBSD = vTasa > 0 ? vMonto / vTasa : 0; resUSD = resBSD / vBCV; } 
    else if (moneda === 'BSD') { resBSD = vMonto; resCOP = vTasa > 0 ? vMonto * vTasa : 0; resUSD = vMonto / vBCV; } 
    else if (moneda === 'USD') { resUSD = vMonto; resBSD = vMonto * vBCV; resCOP = vTasa > 0 ? resBSD * vTasa : 0; } 
    else if (moneda === 'ZELLE') { resUSD = vMonto; resBSD = vTasa > 0 ? vMonto * vTasa : 0; resCOP = resBSD / vBCV; } 
  } 

  function enviarWS() { 
    const msg = '¡Hola! Vengo de su calculadora antiestafas 🛡️.\nConsulta: *' + formatear(vMonto, 2) + ' ' + moneda + '*\nTasa: *' + vTasa + '*'; 
    Linking.openURL('whatsapp://send?phone=' + wsNum + '&text=' + encodeURIComponent(msg)); 
  } 

  return ( 
    <SafeAreaView style={s.container}> 
      <StatusBar barStyle="light-content" /> 
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{flex:1}}> 
        <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 120}}> 
          
          <Pressable onLongPress={() => setModalPin(true)} delayLongPress={3000} style={s.header}> 
            <FontAwesome5 name="gem" size={30} color={COLORES.accent} /> 
            <Text style={s.titulo}>ELITE CAMBIOS</Text> 
          </Pressable> 

          <View style={s.bcvCard}> 
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', alignItems:'center', paddingHorizontal:10}}>
                <View>
                    <Text style={s.bcvLabel}>MONITOR BCV OFICIAL</Text> 
                    {cargando ? <ActivityIndicator color={COLORES.bcv} /> : <Text style={s.bcvText}>{formatear(vBCV, 2)} BsD</Text> } 
                </View>
                <TouchableOpacity onPress={refreshApp} style={s.refreshBtn}>
                    <Ionicons name="refresh-circle" size={38} color={COLORES.bcv} />
                </TouchableOpacity>
            </View>
          </View> 

          <Text style={s.label}>¿QUÉ MONEDA DESEAS CALCULAR?</Text> 
          <View style={s.tabs}> 
            {['COP', 'BSD', 'USD', 'ZELLE'].map((m) => ( 
              <TouchableOpacity key={m} onPress={() => { setMoneda(m); setTasa(''); }} style={[s.tab, moneda === m && s.tabAct]} > 
                <Text style={[s.tabText, moneda === m && s.tabTextAct]}> {m === 'ZELLE' ? '🏦 ZELLE' : m === 'COP' ? '🇨🇴 COP' : m === 'BSD' ? '🇻🇪 BsD' : '🇺🇸 USD'} </Text> 
              </TouchableOpacity> 
            ))} 
          </View> 

          <View style={{flexDirection:'row', gap:10, marginTop:20}}> 
            <View style={{flex:1.5}}> 
              <Text style={s.label}>MONTO</Text> 
              <TextInput style={s.input} keyboardType="decimal-pad" value={monto} onChangeText={setMonto} placeholder="0" placeholderTextColor={COLORES.textMut} /> 
            </View> 
            <View style={{flex:1}}> 
              <Text style={s.label}>TASA</Text> 
              <TextInput style={s.inputTasa} keyboardType="decimal-pad" value={tasa} onChangeText={setTasa} placeholder="0.00" placeholderTextColor={COLORES.textMut} /> 
            </View> 
          </View> 

          <View style={s.resCard}> 
            {moneda === 'ZELLE' ? ( 
              <View> 
                <Text style={s.resHeader}>RESULTADO ZELLE 🇺🇸</Text> 
                <View style={s.resRow}> <Text style={s.resLabel}>Cantidad Zelle</Text> <Text style={[s.resVal, {color: COLORES.accent}]}>$ {formatear(vMonto, 2)}</Text> </View> 
                <View style={s.resRow}> <Text style={s.resLabel}>Bolívares (BsD)</Text> <Text style={[s.resVal, {color: COLORES.bcv}]}>{formatear(resBSD, 2)}</Text> </View> 
                <View style={s.line} /> 
                <View style={s.resRow}> <Text style={s.resLabel}>Dólar BCV (Valor Real)</Text> <Text style={[s.resVal, {color: '#25D366'}]}>$ {formatear(resCOP, 2)}</Text> </View> 
              </View> 
            ) : ( 
              <View> 
                <Text style={s.resHeader}>CONVERSIÓN EXACTA</Text> 
                <View style={s.resRow}> <Text style={s.resLabel}>🇨🇴 Pesos Colombianos</Text> <Text style={[s.resVal, {color: COLORES.accent}]}>$ {formatear(resCOP, 0)}</Text> </View> 
                <View style={s.line} /> 
                <View style={s.resRow}> <Text style={s.resLabel}>🇻🇪 Bolívares (BsD)</Text> <Text style={[s.resVal, {color: COLORES.bcv}]}>{formatear(resBSD, 2)}</Text> </View> 
                <View style={s.line} /> 
                <View style={s.resRow}> <Text style={s.resLabel}>🇺🇸 Dólares (USD)</Text> <Text style={[s.resVal, {color: '#25D366'}]}>$ {formatear(resUSD, 2)}</Text> </View> 
              </View> 
            )} 
          </View> 
        </ScrollView> 
      </KeyboardAvoidingView> 

      <TouchableOpacity style={s.btnWS} onPress={enviarWS}> 
        <Ionicons name="logo-whatsapp" size={24} color="#000" /> 
        <Text style={s.btnWSText}>COTIZAR OPERACIÓN</Text> 
      </TouchableOpacity> 

      <Modal visible={modalPin} transparent> 
        <View style={s.mOvr}> 
          <View style={s.mSheet}> 
            <Text style={s.mTit}>PIN MAESTRO</Text> 
            <TextInput style={s.mInp} secureTextEntry value={pinIn} onChangeText={setPinIn} keyboardType="numeric" maxLength={4} /> 
            <TouchableOpacity style={s.mBtn} onPress={() => { if (pinIn === PIN_SECRETO) { setModalPin(false); setPinIn(''); setTimeout(() => setModalCfg(true), 300); } else { Alert.alert("Error", "PIN incorrecto"); setPinIn(''); } }}> <Text style={s.mBtnT}>ENTRAR</Text> </TouchableOpacity> 
          </View> 
        </View> 
      </Modal> 

      <Modal visible={modalCfg} transparent> 
        <View style={s.mOvr}> 
          <View style={s.mSheet}> 
            <Text style={s.mTit}>NUEVO WHATSAPP</Text> 
            <TextInput style={s.mInp} value={nuevoNum} onChangeText={setNuevoNum} keyboardType="numeric" placeholder="57..." /> 
            <TouchableOpacity style={[s.mBtn, {backgroundColor:'#25D366'}]} onPress={async () => { await AsyncStorage.setItem(STORAGE_KEY_NUMERO, nuevoNum); setWsNum(nuevoNum); setModalCfg(false); }}> <Text style={s.mBtnT}>GUARDAR</Text> </TouchableOpacity> 
          </View> 
        </View> 
      </Modal> 
    </SafeAreaView> 
  ); 
} 

const s = StyleSheet.create({ 
  container: { flex: 1, backgroundColor: COLORES.bg }, 
  header: { alignItems: 'center', marginVertical: 20 }, 
  titulo: { color: COLORES.accent, fontSize: 16, fontWeight: '900', letterSpacing: 5, marginTop: 8 }, 
  bcvCard: { backgroundColor: '#0A0A0A', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#1A1A1A', marginBottom: 20 }, 
  bcvLabel: { color: COLORES.bcv, fontSize: 10, fontWeight: '800', letterSpacing: 2 }, 
  bcvText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 5 }, 
  refreshBtn: { padding: 5 },
  label: { color: COLORES.textMut, fontSize: 9, fontWeight: '800', marginBottom: 8, letterSpacing: 1 }, 
  tabs: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' }, 
  tab: { flex: 1, minWidth: '48%', backgroundColor: '#0D0D0D', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', marginBottom: 5 }, 
  tabAct: { borderColor: COLORES.accent, backgroundColor: '#151515' }, 
  tabText: { color: COLORES.textMut, fontSize: 11, fontWeight: '700' }, 
  tabTextAct: { color: '#fff' }, 
  input: { backgroundColor: '#0D0D0D', padding: 18, borderRadius: 12, color: COLORES.bcv, fontSize: 26, fontWeight: '800', borderWidth: 1, borderColor: '#1A1A1A', textAlign: 'center' }, 
  inputTasa: { backgroundColor: '#0D0D0D', padding: 18, borderRadius: 12, color: COLORES.accent, fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: '#1A1A1A', textAlign: 'center' }, 
  resCard: { backgroundColor: '#0D0D0D', padding: 22, borderRadius: 18, borderWidth: 1, borderColor: '#1A1A1A', marginTop: 20 }, 
  resHeader: { color: COLORES.accent, fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: 2 }, 
  resRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 }, 
  resLabel: { color: COLORES.textSec, fontSize: 13 }, 
  resVal: { fontSize: 20, fontWeight: '900' }, 
  line: { height: 1, backgroundColor: '#1A1A1A', marginVertical: 10 }, 
  btnWS: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, 
  btnWSText: { color: '#000', fontWeight: '900', fontSize: 14 }, 
  mOvr: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 }, 
  mSheet: { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222' }, 
  mTit: { color: '#fff', textAlign: 'center', fontWeight: '800', marginBottom: 20 }, 
  mInp: { backgroundColor: '#000', padding: 15, borderRadius: 10, color: '#fff', textAlign: 'center', fontSize: 20, marginBottom: 15 }, 
  mBtn: { backgroundColor: COLORES.accent, padding: 15, borderRadius: 10, alignItems: 'center' }, 
  mBtnT: { fontWeight: '900', color: '#000' } 
});