import { useState } from 'react';
import { Platform, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { config } from '../lib/config';
import { daysUntil, formatDate, shareLink, type Corner } from '../lib/corner';
import { Body, Button, Card, Title } from '../ui/kit';
import { useTheme } from '../ui/theme';

export function CornerScreen(props: { corner: Corner; onBack: () => void }) {
  const t = useTheme();
  const { corner } = props;
  const link = shareLink(config.supporterUrl, corner.share_token);
  const days = daysUntil(corner.finish_date);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  async function share() {
    if (Platform.OS === 'web') return copy();
    await Share.share({
      message: `I'm on my way to ${corner.name}. Record a short voice note and I'll hear it while I train: ${link}`,
    });
  }

  return (
    <View>
      <Button label="‹ All corners" kind="quiet" onPress={props.onBack} style={{ alignSelf: 'flex-start', marginTop: 0, minHeight: 40, paddingHorizontal: 0 }} />
      <Title>{corner.name}</Title>
      <Body muted>
        {formatDate(corner.finish_date)}
        {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} to go` : days === 0 ? ' · today' : ''}
      </Body>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 6 }}>Invite your people</Text>
        <Body muted>Anyone with this link can record a note for you. No app, no account.</Body>
        <Text testID="share-link" selectable style={{ fontSize: 15, color: t.ink, backgroundColor: t.soft, borderRadius: 10, padding: 12, marginTop: 12 }}>
          {link}
        </Text>
        <Button label="Share link" kind="primary" onPress={share} />
        <Button label={copied ? 'Copied' : 'Copy link'} onPress={copy} />
      </Card>
    </View>
  );
}
