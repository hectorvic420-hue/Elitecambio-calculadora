import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Linking, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal, Alert, Pressable, AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── CAPA 1: SHA-256 PURO JS ──────────────────────────────────────────────────
var sha256 = (function () {
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  function rotr(n, x) { return (n >>> x) | (n << (32 - x)); }
  function hash(ascii) {
    var maxWord = Math.pow(2, 32);
    var i, j, result = '';
    var words = [];
    var asciiBitLength = ascii.length * 8;
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words.length] = ((asciiBitLength / maxWord) | 0);
    words[words.length] = asciiBitLength;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var oldH = H.slice();
      H = H.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = H[0], e = H[4];
        var t1 = H[7]
          + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25))
          + ((e & H[5]) ^ ((~e) & H[6]))
          + K[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22))
          + ((a & H[1]) ^ (a & H[2]) ^ (H[1] & H[2]));
        H = [(t1 + t2) | 0].concat(H);
        H[4] = (H[4] + t1) | 0;
        H.length = 8;
      }
      H = H.map(function (v, i) { return (v + oldH[i]) | 0; });
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (H[i] >> (j * 8)) & 255;
        result += ((b < 16) ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }
  return hash;
})();

// ── CAPA 2: CIFRADO XOR + SALT PARA EL NÚMERO DE TELÉFONO ───────────────────
var CIPHER = (function () {
  var _p1 = 'EC', _p2 = 'x9', _p3 = 'K!', _p4 = '3L';
  var _p5 = 'it', _p6 = '3$', _p7 = 'C4', _p8 = 'mb';
  function _getKey() {
    return sha256(_p1 + _p2 + _p3 + _p4 + _p5 + _p6 + _p7 + _p8).substring(0, 32);
  }
  function encrypt(text) {
    try {
      var key = _getKey();
      var salt = Math.random().toString(36).substring(2, 10);
      var combined = salt + '|' + text;
      var result = '';
      for (var i = 0; i < combined.length; i++) {
        result += String.fromCharCode(combined.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(result);
    } catch (e) { return ''; }
  }
  function decrypt(encoded) {
    try {
      var key = _getKey();
      var decoded = atob(encoded);
      var result = '';
      for (var i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      var parts = result.split('|');
      if (parts.length < 2) return '';
      return parts.slice(1).join('|');
    } catch (e) { return ''; }
  }
  return { encrypt: encrypt, decrypt: decrypt };
})();

// ── CAPA 3: CONFIGURACIÓN DE SEGURIDAD ──────────────────────────────────────
var SEC = {
  // sha256("0831") — cambiar PIN: calcular sha256(nuevoPIN) y actualizar esta línea
  PIN_H:   '9a23cbe921673632bac8e727e5d8d53774c8f6e94f11fc71c044857d6a3475ff',
  MAX_INT: 3,        // intentos antes de bloqueo
  LOCK_MS: 1800000,  // 30 minutos
  BG_LOCK: 300000,   // bloquear config tras 5 min en background
  WS_CD:   10000,    // cooldown WhatsApp 10 s
  API_TO:  6000,     // timeout API 6 s
  BCV_MIN: 1,
  BCV_MAX: 100000,
  SK_NUM:  '@ec_n_v3',
  SK_ATT:  '@ec_a_v3',
  SK_LCK:  '@ec_l_v3',
};

// ── CAPA 4: PROTECCIÓN CONTRA FUERZA BRUTA ──────────────────────────────────
var BruteForce = {
  getAttempts: async function () {
    try { var v = await AsyncStorage.getItem(SEC.SK_ATT); return v ? parseInt(v) : 0; } catch (e) { return 0; }
  },
  getLockUntil: async function () {
    try { var v = await AsyncStorage.getItem(SEC.SK_LCK); return v ? parseInt(v) : 0; } catch (e) { return 0; }
  },
  isLocked: async function () {
    return (await this.getLockUntil()) > Date.now();
  },
  getRemainingLock: async function () {
    var remaining = (await this.getLockUntil()) - Date.now();
    return remaining <= 0 ? 0 : Math.ceil(remaining / 60000);
  },
  registerFail: async function () {
    var attempts = (await this.getAttempts()) + 1;
    await AsyncStorage.setItem(SEC.SK_ATT, String(attempts));
    if (attempts >= SEC.MAX_INT) {
      await AsyncStorage.setItem(SEC.SK_LCK, String(Date.now() + SEC.LOCK_MS));
      await AsyncStorage.setItem(SEC.SK_ATT, '0');
      return { locked: true, minutes: 30 };
    }
    return { locked: false, remaining: SEC.MAX_INT - attempts };
  },
  registerSuccess: async function () {
    await AsyncStorage.setItem(SEC.SK_ATT, '0');
    await AsyncStorage.setItem(SEC.SK_LCK, '0');
  },
};

// ── CAPA 5: FETCH BCV CON TIMEOUT Y VALIDACIÓN ──────────────────────────────
async function fetchBCVSeguro() {
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeoutId = null;
  try {
    var fetchOpts = controller ? { signal: controller.signal } : {};
    if (controller) timeoutId = setTimeout(function () { controller.abort(); }, SEC.API_TO);
    var res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', fetchOpts);
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return null;
    var data = await res.json();
    var rawRate = data.promedio || data.venta || 0;
    if (typeof rawRate !== 'number') return null;
    if (isNaN(rawRate) || rawRate < SEC.BCV_MIN || rawRate > SEC.BCV_MAX) return null;
    return Number(rawRate).toFixed(2);
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

// ── CAPA 6: RATE LIMITER WHATSAPP ────────────────────────────────────────────
var _ultimoWS = 0;
function puedeEnviarWS() { return (Date.now() - _ultimoWS) > SEC.WS_CD; }
function registrarEnvioWS() { _ultimoWS = Date.now(); }

// ── COLORES ──────────────────────────────────────────────────────────────────
var COLORES = {
  bg: '#050505', surface: '#111111', border: '#222222',
  accent: '#E5E5E5', bcv: '#4fc3f7', textSec: '#A0A0A0', textMut: '#444444',
};

// ── FORMATEADOR ──────────────────────────────────────────────────────────────
function formatear(n, decimales) {
  if (decimales === undefined) decimales = 2;
  if (!n || isNaN(n) || n === 0) return decimales === 0 ? '0' : '0,00';
  return Number(n).toLocaleString('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

// ── PARSER INTELIGENTE COP / INTERNACIONAL ───────────────────────────────────
function limpiarParaCalculo(input) {
  if (!input) return 0;
  var s = input.toString().replace(/\s/g, '');
  if (!s || s === '-' || s === '.') return 0;
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s) || 0;
  }
  if (s.includes('.')) {
    var partes = s.split('.');
    if (partes.length > 2) { s = s.replace(/\./g, ''); return parseFloat(s) || 0; }
    if (partes[partes.length - 1].length === 3) { s = s.replace(/\./g, ''); return parseFloat(s) || 0; }
    return parseFloat(s) || 0;
  }
  if (s.includes(',')) { s = s.replace(',', '.'); return parseFloat(s) || 0; }
  var r = parseFloat(s);
  if (r > 9999999999) return 0;
  return isNaN(r) ? 0 : r;
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AppElite() {
  var [moneda,      setMoneda]      = useState('COP');
  var [monto,       setMonto]       = useState('');
  var [tasa,        setTasa]        = useState('');
  var [tasaBCV,     setTasaBCV]     = useState('');
  var [cargando,    setCargando]    = useState(true);
  var [refrescando, setRefrescando] = useState(false);
  var [wsNum,       setWsNum]       = useState('');
  var [modalPin,    setModalPin]    = useState(false);
  var [pinIn,       setPinIn]       = useState('');
  var [modalCfg,    setModalCfg]    = useState(false);
  var [nuevoNum,    setNuevoNum]    = useState('');
  var [pinError,    setPinError]    = useState('');
  var [bloqueado,   setBloqueado]   = useState(false);
  var [minBloq,     setMinBloq]     = useState(0);

  var bgTimestamp = useRef(null);
  var appStateRef = useRef(AppState.currentState);

  // ── INIT ──
  useEffect(function () {
    async function init() {
      try {
        var numCifrado = await AsyncStorage.getItem(SEC.SK_NUM);
        if (numCifrado) {
          var dec = CIPHER.decrypt(numCifrado);
          if (dec) setWsNum(dec);
        }
        var locked = await BruteForce.isLocked();
        if (locked) {
          var mins = await BruteForce.getRemainingLock();
          setBloqueado(true);
          setMinBloq(mins);
        }
        await refrescarBCV();
      } catch (e) {
        setCargando(false);
      }
    }
    init();
  }, []);

  // ── SESSION TIMEOUT EN BACKGROUND ──
  useEffect(function () {
    var sub = AppState.addEventListener('change', function (nextState) {
      if (appStateRef.current === 'active' && nextState !== 'active') {
        bgTimestamp.current = Date.now();
      }
      if (nextState === 'active' && bgTimestamp.current) {
        if (Date.now() - bgTimestamp.current > SEC.BG_LOCK) {
          setModalCfg(false);
          setModalPin(false);
          setPinIn('');
        }
        bgTimestamp.current = null;
      }
      appStateRef.current = nextState;
    });
    return function () { sub.remove(); };
  }, []);

  // ── FETCH BCV ──
  async function refrescarBCV() {
    setCargando(true);
    setRefrescando(true);
    var rate = await fetchBCVSeguro();
    if (rate) {
      setTasaBCV(rate);
    } else {
      setTasaBCV(function (prev) {
        if (!prev) Alert.alert('Sin conexión', 'No se pudo obtener la tasa BCV. Verifica tu internet.');
        return prev || '';
      });
    }
    setCargando(false);
    setRefrescando(false);
  }

  // ── CÁLCULOS ──
  var vMonto = limpiarParaCalculo(monto);
  var vTasa  = limpiarParaCalculo(tasa);
  var vBCV   = limpiarParaCalculo(tasaBCV);
  var resCOP = 0, resBSD = 0, resUSD = 0;

  if (vMonto > 0 && vBCV > 0) {
    if (moneda === 'COP') {
      resCOP = vMonto;
      resBSD = vTasa > 0 ? vMonto / vTasa : 0;
      resUSD = vBCV > 0 ? resBSD / vBCV : 0;
    } else if (moneda === 'BSD') {
      resBSD = vMonto;
      resCOP = vTasa > 0 ? vMonto * vTasa : 0;
      resUSD = vBCV > 0 ? vMonto / vBCV : 0;
    } else if (moneda === 'USD') {
      resUSD = vMonto;
      resBSD = vMonto * vBCV;
      resCOP = vTasa > 0 ? resBSD * vTasa : 0;
    } else if (moneda === 'ZELLE') {
      resUSD = vMonto;
      resBSD = vTasa > 0 ? vMonto * vTasa : 0;
      resCOP = vBCV > 0 ? resBSD / vBCV : 0;
    }
  }

  // ── WHATSAPP CON RATE LIMIT ──
  function enviarWS() {
    if (!wsNum) {
      Alert.alert('Configuración', 'No hay número configurado.\nMantén el logo presionado para configurar.');
      return;
    }
    if (!puedeEnviarWS()) {
      var segs = Math.ceil((SEC.WS_CD - (Date.now() - _ultimoWS)) / 1000);
      Alert.alert('Espera', 'Aguarda ' + segs + ' segundos antes de enviar otra consulta.');
      return;
    }
    registrarEnvioWS();
    var msg = '¡Hola! Vengo de la calculadora antiestafas 🛡️.\nConsulta: *'
      + formatear(vMonto, 2) + ' ' + moneda + '*\nTasa: *' + vTasa + '*';
    Linking.openURL('whatsapp://send?phone=' + wsNum + '&text=' + encodeURIComponent(msg));
  }

  // ── VERIFICAR PIN CON SHA-256 ──
  async function verificarPin() {
    if (!pinIn || pinIn.length === 0) { setPinError('Ingresa el PIN'); return; }
    var locked = await BruteForce.isLocked();
    if (locked) {
      var mins = await BruteForce.getRemainingLock();
      setPinError('Bloqueado. Espera ' + mins + ' min.');
      setBloqueado(true); setMinBloq(mins); return;
    }
    var pinValido = sha256(pinIn) === SEC.PIN_H;
    setPinIn('');
    if (pinValido) {
      await BruteForce.registerSuccess();
      setPinError(''); setBloqueado(false);
      setModalPin(false);
      setTimeout(function () { setModalCfg(true); }, 300);
    } else {
      var resultado = await BruteForce.registerFail();
      if (resultado.locked) {
        setPinError('Bloqueado 30 minutos por múltiples intentos fallidos.');
        setBloqueado(true); setMinBloq(30);
      } else {
        setPinError('PIN incorrecto. ' + resultado.remaining + ' intento(s) restante(s).');
      }
    }
  }

  // ── GUARDAR NÚMERO CIFRADO ──
  async function guardarNumero() {
    if (!nuevoNum || nuevoNum.length < 10) {
      Alert.alert('Error', 'Ingresa un número válido (mínimo 10 dígitos)'); return;
    }
    if (!/^\d+$/.test(nuevoNum)) {
      Alert.alert('Error', 'El número solo debe contener dígitos'); return;
    }
    var cifrado = CIPHER.encrypt(nuevoNum);
    await AsyncStorage.setItem(SEC.SK_NUM, cifrado);
    setWsNum(nuevoNum); setNuevoNum(''); setModalCfg(false);
    Alert.alert('Guardado', 'Número actualizado correctamente');
  }

  // ── ABRIR MODAL PIN ──
  async function abrirModalPin() {
    var locked = await BruteForce.isLocked();
    if (locked) {
      var mins = await BruteForce.getRemainingLock();
      Alert.alert('Acceso Bloqueado', 'Demasiados intentos.\nIntenta en ' + mins + ' minutos.');
      return;
    }
    setPinError(''); setPinIn(''); setModalPin(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

          {/* HEADER — long press 3 s activa modal PIN */}
          <Pressable onLongPress={abrirModalPin} delayLongPress={3000} style={s.header}>
            <Ionicons name="diamond-outline" size={54} color={COLORES.accent} />
            <Text style={s.titulo}>ELITE CAMBIOS</Text>
          </Pressable>

          {/* TASA BCV */}
          <View style={s.bcvCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10 }}>
              <View>
                <Text style={s.bcvLabel}>MONITOR BCV OFICIAL</Text>
                {cargando
                  ? <ActivityIndicator color={COLORES.bcv} style={{ marginTop: 5 }} />
                  : <Text style={s.bcvText}>{tasaBCV ? formatear(limpiarParaCalculo(tasaBCV), 2) + ' BsD' : '— Sin datos —'}</Text>
                }
              </View>
              <TouchableOpacity onPress={refrescarBCV} disabled={refrescando} style={s.refreshBtn} activeOpacity={0.7}>
                {refrescando
                  ? <ActivityIndicator color={COLORES.bcv} size="small" />
                  : <Ionicons name="refresh-circle" size={38} color={COLORES.bcv} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* SELECTOR DE MONEDA */}
          <Text style={s.label}>¿QUÉ MONEDA DESEAS CALCULAR?</Text>
          <View style={s.tabs}>
            {['COP', 'BSD', 'USD', 'ZELLE'].map(function (m) {
              return (
                <TouchableOpacity
                  key={m}
                  onPress={function () { setMoneda(m); setTasa(''); }}
                  style={[s.tab, moneda === m && s.tabAct]}
                >
                  <Text style={[s.tabText, moneda === m && s.tabTextAct]}>
                    {m === 'ZELLE' ? '🏦 ZELLE' : m === 'COP' ? '🇨🇴 COP' : m === 'BSD' ? '🇻🇪 BsD' : '🇺🇸 USD'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* MONTO Y TASA */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={{ flex: 1.5 }}>
              <Text style={s.label}>MONTO</Text>
              <TextInput
                style={s.input}
                keyboardType="decimal-pad"
                value={monto}
                onChangeText={setMonto}
                placeholder="0"
                placeholderTextColor={COLORES.textMut}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>TASA</Text>
              <TextInput
                style={s.inputTasa}
                keyboardType="decimal-pad"
                value={tasa}
                onChangeText={setTasa}
                placeholder="0.00"
                placeholderTextColor={COLORES.textMut}
              />
            </View>
          </View>

          {/* RESULTADOS */}
          <View style={s.resCard}>
            {moneda === 'ZELLE' ? (
              <View>
                <Text style={s.resHeader}>RESULTADO ZELLE 🇺🇸</Text>
                <View style={s.resRow}>
                  <Text style={s.resLabel}>Cantidad Zelle</Text>
                  <Text style={[s.resVal, { color: COLORES.accent }]}>$ {formatear(vMonto, 2)}</Text>
                </View>
                <View style={s.line} />
                <View style={s.resRow}>
                  <Text style={s.resLabel}>🇻🇪 Bolívares (BsD)</Text>
                  <Text style={[s.resVal, { color: COLORES.bcv }]}>{formatear(resBSD, 2)}</Text>
                </View>
                <View style={s.line} />
                <View style={s.resRow}>
                  <Text style={s.resLabel}>Dólar BCV (Valor Real)</Text>
                  <Text style={[s.resVal, { color: '#25D366' }]}>$ {formatear(resCOP, 2)}</Text>
                </View>
              </View>
            ) : (
              <View>
                <Text style={s.resHeader}>CONVERSIÓN EXACTA</Text>
                <View style={s.resRow}>
                  <Text style={s.resLabel}>🇨🇴 Pesos Colombianos</Text>
                  <Text style={[s.resVal, { color: COLORES.accent }]}>$ {formatear(resCOP, 0)}</Text>
                </View>
                <View style={s.line} />
                <View style={s.resRow}>
                  <Text style={s.resLabel}>🇻🇪 Bolívares (BsD)</Text>
                  <Text style={[s.resVal, { color: COLORES.bcv }]}>{formatear(resBSD, 2)}</Text>
                </View>
                <View style={s.line} />
                <View style={s.resRow}>
                  <Text style={s.resLabel}>🇺🇸 Dólares (USD)</Text>
                  <Text style={[s.resVal, { color: '#25D366' }]}>$ {formatear(resUSD, 2)}</Text>
                </View>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTÓN WHATSAPP */}
      <TouchableOpacity style={s.btnWS} onPress={enviarWS}>
        <Ionicons name="logo-whatsapp" size={24} color="#000" />
        <Text style={s.btnWSText}>COTIZAR OPERACIÓN</Text>
      </TouchableOpacity>

      {/* MODAL PIN */}
      <Modal visible={modalPin} transparent animationType="fade">
        <View style={s.mOvr}>
          <View style={s.mSheet}>
            <Ionicons name="lock-closed" size={32} color={COLORES.bcv} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={s.mTit}>PIN MAESTRO</Text>
            {bloqueado && (
              <Text style={s.mErr}>Bloqueado {minBloq} min por intentos fallidos</Text>
            )}
            <TextInput
              style={s.mInp}
              secureTextEntry
              value={pinIn}
              onChangeText={setPinIn}
              keyboardType="numeric"
              maxLength={6}
              editable={!bloqueado}
              placeholder="••••"
              placeholderTextColor={COLORES.textMut}
            />
            {pinError ? <Text style={s.mErr}>{pinError}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.mBtn, { flex: 1, backgroundColor: '#1a1a1a' }]} onPress={function () { setModalPin(false); setPinIn(''); setPinError(''); }}>
                <Text style={[s.mBtnT, { color: COLORES.textSec }]}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, { flex: 1 }]} onPress={verificarPin} disabled={bloqueado}>
                <Text style={s.mBtnT}>ENTRAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURACIÓN */}
      <Modal visible={modalCfg} transparent animationType="fade">
        <View style={s.mOvr}>
          <View style={s.mSheet}>
            <Ionicons name="logo-whatsapp" size={32} color="#25D366" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={s.mTit}>NÚMERO WHATSAPP</Text>
            <Text style={s.mSub}>Incluye código de país (ej: 573001234567)</Text>
            <TextInput
              style={s.mInp}
              value={nuevoNum}
              onChangeText={setNuevoNum}
              keyboardType="numeric"
              placeholder="57300..."
              placeholderTextColor={COLORES.textMut}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[s.mBtn, { flex: 1, backgroundColor: '#1a1a1a' }]} onPress={function () { setModalCfg(false); setNuevoNum(''); }}>
                <Text style={[s.mBtnT, { color: COLORES.textSec }]}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, { flex: 1, backgroundColor: '#25D366' }]} onPress={guardarNumero}>
                <Text style={s.mBtnT}>GUARDAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── ESTILOS ──────────────────────────────────────────────────────────────────
var s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORES.bg },
  header:      { alignItems: 'center', marginVertical: 24 },
  titulo:      { color: COLORES.accent, fontSize: 15, fontWeight: '900', letterSpacing: 8, marginTop: 10 },
  bcvCard:     { backgroundColor: '#0A0A0A', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#1A1A1A', marginBottom: 20 },
  bcvLabel:    { color: COLORES.bcv, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  bcvText:     { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 5 },
  refreshBtn:  { padding: 5 },
  label:       { color: COLORES.textMut, fontSize: 9, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  tabs:        { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tab:         { flex: 1, minWidth: '48%', backgroundColor: '#0D0D0D', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1A1A1A', alignItems: 'center', marginBottom: 5 },
  tabAct:      { borderColor: COLORES.accent, backgroundColor: '#151515' },
  tabText:     { color: COLORES.textMut, fontSize: 11, fontWeight: '700' },
  tabTextAct:  { color: '#fff' },
  input:       { backgroundColor: '#0D0D0D', padding: 18, borderRadius: 12, color: COLORES.bcv, fontSize: 26, fontWeight: '800', borderWidth: 1, borderColor: '#1A1A1A', textAlign: 'center' },
  inputTasa:   { backgroundColor: '#0D0D0D', padding: 18, borderRadius: 12, color: COLORES.accent, fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: '#1A1A1A', textAlign: 'center' },
  resCard:     { backgroundColor: '#0D0D0D', padding: 22, borderRadius: 18, borderWidth: 1, borderColor: '#1A1A1A', marginTop: 20 },
  resHeader:   { color: COLORES.accent, fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  resRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  resLabel:    { color: COLORES.textSec, fontSize: 13 },
  resVal:      { fontSize: 20, fontWeight: '900' },
  line:        { height: 1, backgroundColor: '#1A1A1A', marginVertical: 10 },
  btnWS:       { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#fff', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnWSText:   { color: '#000', fontWeight: '900', fontSize: 14 },
  mOvr:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 30 },
  mSheet:      { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  mTit:        { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16, marginBottom: 6 },
  mSub:        { color: COLORES.textMut, textAlign: 'center', fontSize: 11, marginBottom: 16 },
  mInp:        { backgroundColor: '#000', padding: 15, borderRadius: 10, color: '#fff', textAlign: 'center', fontSize: 20, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  mBtn:        { backgroundColor: COLORES.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  mBtnT:       { fontWeight: '900', color: '#000' },
  mErr:        { color: '#ff4444', textAlign: 'center', fontSize: 12, marginBottom: 10 },
});
