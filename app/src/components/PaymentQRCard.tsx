import { decode as atob } from "base-64";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { paymentQrApi, EsewaQr } from "../services/api";
import QRCode from "react-native-qrcode-svg";
import { Linking } from "react-native";

type PaymentQR = {
  invoiceId: number;
  paymentId: number;
  transactionUuid: string;
  amount: string;
  qrPayload: string;
  qrCodeDataUri: string;
  expiresAt: string;
};

const svgFromDataUri = (uri: string) => atob(uri.split(",")[1] ?? "");

const formatRemaining = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function PaymentQRCard({ jobId }: { jobId: number | string }) {
  const [qr, setQr] = useState<PaymentQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  const fetchQr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentQrApi.getEsewaIntentQr(jobId);
      setQr(data);
      setRemaining(new Date(data.expiresAt).getTime() - Date.now());
    } catch (e: any) {
      console.log("QR error:", e?.message, e);
      setError(e?.message ?? "Could not load payment QR.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // ⬇️ add here, right after fetchQr
  const openInEsewa = async () => {
    if (!qr?.qrPayload) return;
    try {
      await Linking.openURL(qr.qrPayload);
    } catch (e) {
      console.log("Open payload failed:", e);
    }
  };

  useEffect(() => {
    fetchQr();
  }, [fetchQr]);


  // countdown
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      setRemaining(new Date(qr.expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [qr]);

  const expired = !!qr && remaining <= 0;

  if (loading) return <ActivityIndicator style={{ marginVertical: 24 }} />;

  if (error || !qr ) {
    return (
      <View style={styles.card}>
        <Text style={styles.error}>{error ?? "QR unavailable."}</Text>
        <TouchableOpacity style={styles.btn} onPress={fetchQr}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pay with eSewa</Text>
      <Text style={styles.amount}>Rs. {qr.amount}</Text>

      <View style={[styles.qrWrap, expired && { opacity: 0.25 }]}>
        <QRCode value={qr.qrPayload} size={220} />
      </View>

      {expired ? (
        <>
          <Text style={styles.error}>This QR has expired.</Text>
          <TouchableOpacity style={styles.btn} onPress={fetchQr}>
            <Text style={styles.btnText}>Generate new QR</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.hint}>
            Scan with eSewa · expires in {formatRemaining(remaining)}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={openInEsewa}>
            <Text style={styles.btnText}>Pay from this phone</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginVertical: 12,
  },
  title: { fontSize: 16, fontWeight: "600" },
  amount: { fontSize: 22, fontWeight: "700", marginVertical: 8 },
  qrWrap: { padding: 12, backgroundColor: "#fff", borderRadius: 12 },
  hint: { marginTop: 12, color: "#666" },
  error: { marginTop: 12, color: "#c0392b", textAlign: "center" },
  btn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#60bb46",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
