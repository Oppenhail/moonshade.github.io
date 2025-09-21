import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Wrench } from 'lucide-react';

export default function BotBridge({ serializeForBot }){
  const [copied, setCopied] = React.useState(false);
  const data = serializeForBot();

  const instructions =
`1) Download the ZIP (board.json + icons) from the Events tab.
2) On your bot host, put icons into:
   data/events/tiletrials/${data.eventName}/icons
3) In Discord, upload the board.json:
   /tiletrials upload event:<event-id> file:<board.json>
4) Teams & dice:
   /tiletrials team-create ...
   /tiletrials set-dice ...
5) Post the board + per-team Roll buttons:
   /tiletrials setup event:<event-id>`;

  const commands = [
    `# List teams\n/tiletrials teams event:<event-id>`,
    `# Set dice sides\n/tiletrials set-dice event:<event-id> sides:6`,
    `# Create a team\n/tiletrials team-create event:<event-id> name:"Team Alpha" color:#0ea5e9`,
    `# Post board + Roll buttons\n/tiletrials setup event:<event-id>`
  ].join('\n\n');

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4" /> Discord Bot Bridge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm opacity-80 whitespace-pre-line">{instructions}</div>
        <div>
          <Label>Sample Commands</Label>
          <pre className="bg-black/40 rounded-xl p-3 text-xs whitespace-pre-wrap">{commands}</pre>
        </div>
        <Button onClick={()=>{
          navigator.clipboard?.writeText(commands);
          setCopied(true); setTimeout(()=>setCopied(false), 1100);
        }}>{copied ? 'Copied ✓' : 'Copy commands'}</Button>
      </CardContent>
    </Card>
  );
}
