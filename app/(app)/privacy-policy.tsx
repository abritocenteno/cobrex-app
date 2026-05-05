import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import ScreenContainer from '../../src/components/ScreenContainer';

const Section = ({ title, children }: { title: string; children: string }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 8 }}>{title}</Text>
    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: Colors.textMuted, lineHeight: 22 }}>{children}</Text>
  </View>
);

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 8, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: Colors.textPrimary }}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 48 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 24 }}>
          Last updated: May 2026
        </Text>

        <Section title="Who we are">
          {`Cobrex is an artist management platform built for independent musicians and their teams. We are the data controller for information you provide when using the Cobrex app.`}
        </Section>

        <Section title="What data we collect">
          {`We collect the following information:\n\n• Account data: your name, email address, and role (artist, manager, or venue), provided during sign-up via Clerk.\n\n• Profile data: artist name, biography, location, genre, social media handles, and profile photos you upload.\n\n• Work data: shows, deals, contacts, setlists, assets, timeline events, and alerts you create within the app.\n\n• Files: documents and images you upload (tech riders, contracts, press photos, etc.) stored via Convex cloud storage.\n\n• Usage data: basic telemetry such as authentication events and error logs, used to maintain service reliability.`}
        </Section>

        <Section title="How we use your data">
          {`Your data is used solely to provide the Cobrex service:\n\n• Displaying your profile and content within the app\n• Enabling collaboration features (manager–artist roster, shared assets)\n• Generating share links for assets you choose to share publicly\n• Sending in-app notifications related to your activity\n\nWe do not sell your data to third parties or use it for advertising purposes.`}
        </Section>

        <Section title="Third-party services">
          {`Cobrex uses the following third-party services:\n\n• Clerk — authentication and identity management. Clerk processes your email and authentication credentials under their own privacy policy.\n\n• Convex — cloud database and file storage. Your data is stored in Convex's EU-West infrastructure.\n\n• SoundCloud oEmbed API — used only when you voluntarily paste a SoundCloud URL to import track metadata. No account linking occurs.\n\n• Anthropic Claude API — used server-side to extract music metadata (BPM, key, genre) from SoundCloud descriptions you provide. Descriptions are not stored by Anthropic beyond the API request.`}
        </Section>

        <Section title="Data retention">
          {`Your data is retained for as long as your account is active. You may delete your account at any time by contacting us, after which your personal data will be removed within 30 days. Uploaded files are deleted from storage upon account deletion.`}
        </Section>

        <Section title="Your rights">
          {`Under GDPR and applicable data protection law, you have the right to:\n\n• Access the personal data we hold about you\n• Correct inaccurate data\n• Request deletion of your data\n• Withdraw consent for optional data processing\n• Lodge a complaint with your local data protection authority\n\nTo exercise any of these rights, contact us at privacy@cobrex.app.`}
        </Section>

        <Section title="Cookies and local storage">
          {`On web, we use a single authentication session cookie managed by Clerk to keep you signed in. We ask for your consent before setting any non-essential cookies. You can withdraw consent at any time through your browser settings.`}
        </Section>

        <Section title="Security">
          {`All data is transmitted over HTTPS. Access to your data is restricted to your own account — every operation is verified server-side against your authenticated identity. Uploaded files require authentication to access unless you explicitly generate a share link.`}
        </Section>

        <Section title="Contact">
          {`For privacy-related questions or requests, contact us at:\nprivacy@cobrex.app`}
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}
