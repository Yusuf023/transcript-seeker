import { useEffect, useState } from 'react';
import { fetchMeetingDetails } from '@/components/meeting/data-table';
import { Viewer } from '@/components/viewer';
import { StorageBucketAPI } from '@/lib/bucketAPI';
import { useApiKeysStore, useMeetingsStore, useServerAvailabilityStore } from '@/store';
import { Meeting, MeetingInfo, Meeting as MeetingT, ServerAvailability } from '@/types';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { BLANK_MEETING_INFO } from '@meeting-baas/ui';

async function fetchPublicLink(
  botId: string,
  publicLink: string,
  serverAvailability: ServerAvailability,
): Promise<Meeting> {
  const initialMeeting: Meeting = {
    id: publicLink,
    name: 'Loading...',
    botId: botId!,
    attendees: ['-'],
    createdAt: new Date(),
    status: 'loading',
  };

  try {
    let fetchedDetails = await fetchMeetingDetails(botId, publicLink, serverAvailability);
    return fetchedDetails;
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    return {
      ...initialMeeting,
      name: 'Error fetching meeting details',
      status: 'error',
    };
  }
}

// TODO : Remove it when RSA encryption will be done
const DISABLE_ENCRYPTION: boolean = true;

function MeetingPage() {
  const { botId } = useParams();

  const [searchParams] = useSearchParams();

  let publicLink;
  if (DISABLE_ENCRYPTION) {
    publicLink = searchParams.get('api_key');
  } else {
    publicLink = searchParams.get('public-link');
  }

  const meetings = useMeetingsStore((state) => state.meetings);

  const serverAvailability = useServerAvailabilityStore((state) => state.serverAvailability);
  const baasApiKey = useApiKeysStore((state) => state.baasApiKey);

  const [meetingData, setMeetingData] = useState<MeetingInfo>(BLANK_MEETING_INFO);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeetingData = async (): Promise<MeetingInfo> => {
    // check if it's a public link
    if (publicLink && botId) {
      console.log('fetching public link with public link', publicLink);
      console.log('fetching public link with botId', botId);
      const meeting: Meeting = await fetchPublicLink(botId, publicLink, serverAvailability);
      return meeting.data || BLANK_MEETING_INFO;
    }
    if (!botId) throw new Error('No bot ID provided');

    const meeting: MeetingT | undefined = meetings.find(
      (meeting: MeetingT) => meeting.botId === botId,
    );
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // TODO : Ce local-storage HACK n'est pas assez hospitalier. Ici peuvent venir des problemes d'initialization
    // TODO : Cette fonction devrait pouvoir s'executer plus tard
    // FIXED?
    if (meeting.botId.startsWith('local_file')) {
      const storageAPI = new StorageBucketAPI('local_files');
      await storageAPI.init();

      const videoContent = await storageAPI.get(`${meeting.botId}.mp4`);
      if (videoContent && meeting.data?.assets[0]) meeting.data.assets[0].mp4_blob = videoContent;
    }

    return meeting.data || BLANK_MEETING_INFO;
  };

  useEffect(() => {
    // Not necessary as we can hit a direct page load from this page directly
    // Note: This condition used to check for meetings. Initially, the meetings array will be empty and later populated.
    // if (meetings.length === 0) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const fetchedData = await fetchMeetingData();

        setMeetingData(fetchedData);
        setIsLoading(false);
      } catch (error) {
        console.error('error', error);
        toast.error('Failed to fetch meeting data');
        setIsLoading(false);
      }
    };

    loadData();
  }, [meetings, baasApiKey, serverAvailability]);

  return <Viewer botId={botId!} isLoading={isLoading} meetingData={meetingData} />;
}

export default MeetingPage;
