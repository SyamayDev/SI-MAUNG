function VoiceResult({ transcript }) {
  if (!transcript) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div>
        <strong>Transkrip:</strong>
      </div>
      <div
        style={{
          background: "#fff",
          padding: 10,
          borderRadius: 10,
          marginTop: 6,
        }}
      >
        {transcript}
      </div>
    </div>
  );
}

export default VoiceResult;
