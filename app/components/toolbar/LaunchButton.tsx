import { useProjectManifest } from '@myst-theme/providers';
import * as Popover from '@radix-ui/react-popover';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { CirclePlay } from 'lucide-react';
import React from 'react';
import { usePage } from '../PageProvider';
import { Tooltip } from './Tooltip';

const COLAB_BASE_URL = 'https://colab.research.google.com/github/';
const GITHUB_REPO_SUFFIX = '.notebooks';
const GITHUB_REPO_BRANCH = 'main';

function buildJupyterHubLaunchUrl({
  hubBaseUrl,
  orgRepo,
  filename,
}: {
  hubBaseUrl: string;
  orgRepo: string;
  filename: string;
}) {
  return `${hubBaseUrl}/jupyter/hub/user-redirect/git-pull?repo=https://github.com/${orgRepo}${GITHUB_REPO_SUFFIX}&branch=${GITHUB_REPO_BRANCH}&urlpath=tree/${
    orgRepo.split('/')[1]
  }${GITHUB_REPO_SUFFIX}${filename}`;
}

function LaunchPanel() {
  const project = useProjectManifest();
  const page = usePage();
  const [service, setService] = React.useState<string | undefined>('colab');
  const [privateServiceUrl, setPrivateServiceUrl] = React.useState<string | undefined>();

  const hasGitHub = !!project?.github;
  // Remove the `.myst` suffix from the orgRepo URL if present.
  const orgRepo = project?.github 
                    ? new URL(project?.github).pathname.slice(1).replace(/\.myst$/, '') 
                    : undefined;
  const filename = `${page?.location.split('.')[0]}.ipynb`;

  const handleSelect = React.useCallback((value: string) => setService(value), []);
  const handleLaunch = React.useCallback(() => {
    if (service === 'colab') {
      const url = `${COLAB_BASE_URL}${orgRepo}${GITHUB_REPO_SUFFIX}/blob/${GITHUB_REPO_BRANCH}${filename}`;
      window.open(url, '_blank');
    } else {
      if (!privateServiceUrl || !orgRepo) return;
      const url = buildJupyterHubLaunchUrl({ hubBaseUrl: privateServiceUrl, orgRepo, filename });
      window.open(url, '_blank');
    }
  }, [privateServiceUrl, service, orgRepo, filename]);

  return (
    <div className="p-3 space-y-3">
      <div className="text-lg">Notebook Launcher</div>
      <p className="text-sm text-opacity-80">
        Choose public or private cloud service for "Launch" button.
      </p>
      <p className="text-sm border-b-[1px] border-b-qetoolbar-border">Select a server</p>
      <RadioGroup.Root
        className="flex flex-col space-y-3 text-sm"
        defaultValue="colab"
        onValueChange={handleSelect}
        disabled={!hasGitHub}
      >
        <RadioGroup.Item
          value="colab"
          id="launch-colab"
          autoFocus
          className={`p-2 border-2 gap-2
            border-qetoolbar-border data-[state="checked"]:border-qeborder-blue data-[state="checked"]:bg-qeborder-blue/20 
            flex justify-items-center items-center`}
        >
          Google Colab
        </RadioGroup.Item>
        <RadioGroup.Item
          value="private"
          id="launch-private"
          className={`p-2 border-2
            border-qetoolbar-border data-[state="checked"]:border-qeborder-blue data-[state="checked"]:bg-qeborder-blue/20 
            flex justify-items-center items-center gap-2`}
        >
          <div>Private</div>
          <input
            type="text"
            className="w-full p-1 border dark:bg-qetoolbar-dark rounded-xs border-qetoolbar-border text-qetext-light dark:text-qetext-dark"
            placeholder="Service URL/Endpoint"
            value={privateServiceUrl}
            onChange={(e) => setPrivateServiceUrl(e.target.value)}
          />
        </RadioGroup.Item>
      </RadioGroup.Root>
      <button
        disabled={!service || (service === 'private' && !privateServiceUrl)}
        className="w-full p-1 font-light text-white bg-qeborder-blue/80 hover:bg-qeborder-blue/90 active:bg-qeborder-blue/100 dark:disabled:bg-qetoolbar-dark/90 disabled:bg-qetoolbar-border"
        onClick={handleLaunch}
      >
        Launch Notebook
      </button>
    </div>
  );
}

export function LaunchButton({ size, showLabel }: { size: number; showLabel?: boolean }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex items-center cursor-pointer">
        <Tooltip label="Launch Notebook">
          <CirclePlay
            className="opacity-90 hover:scale-110"
            width={size}
            height={size}
            tabIndex={0}
          />
          {showLabel && <span className="ml-2">Launch</span>}
        </Tooltip>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={3}
          className={`
            z-10 w-[360px] rounded bg-white dark:bg-qepage-dark p-5
            text-qetext-light dark:text-qetext-dark
            will-change-[transform,opacity]
            shadow-md
            dark:shadow-sm
            dark:shadow-white/20
            ring-0
            has(:focus-visible):ring-1
            `}
        >
          <Popover.Arrow className="shadow-md stroke-2 fill-white dark:fill-qepage-dark" />
          <LaunchPanel />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
