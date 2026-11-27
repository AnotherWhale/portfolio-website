import { useEffect, useRef } from "react";
import { fieldSystemCategories } from "../projectRoutes";

type Component = readonly [name: string, detail: string];
type Architecture = {
  inputs: readonly Component[];
  inputLink: string;
  system: string;
  components: readonly Component[];
  outputLink: string;
  outputs: readonly Component[];
};

type Project = {
  title: string;
  repository?: string;
  summary: string;
  operation: string;
  architecture: Architecture;
};

const workGroups: { category: typeof fieldSystemCategories[number]; projects: Project[] }[] = [
  {
    category: fieldSystemCategories[0],
    projects: [{
      title: "FleetMon",
      summary: "A trailer tracking system. Small devices mounted on trailers send locations to a dashboard where fleet staff can see where each trailer was last reported and review its trips.",
      operation: "Dated installation records keep each trailer’s trip history intact when a tracker moves to another trailer. The dashboard shows when the tracker last checked in separately from when it last reported a location.",
      architecture: {
        inputs: [["Trailer-mounted ESP32 trackers", "GNSS positions, heartbeats, and device diagnostics"]],
        inputLink: "MQTT telemetry",
        system: "Raspberry Pi server",
        components: [["Ingestion and API", "Processes messages and associates them with dated installations"], ["SQLite", "Positions, vehicle assignments, and device history"]],
        outputLink: "API and live updates",
        outputs: [["React dashboard", "Fleet map, trip history, geofences, alerts, and device maintenance"]],
      },
    }],
  },
  {
    category: fieldSystemCategories[1],
    projects: [
      {
        title: "Crane Rover", repository: "crane-rover",
        summary: "A small computer mounted on each crane. It uses satellite positioning and readings from nearby units to estimate the distance between cranes.",
        operation: "Each unit calculates the distance to the nearest crane with a recent reading and adjusts the estimate for measurement uncertainty. This calculation runs locally, so it can continue if the monitoring dashboard is unavailable.",
        architecture: {
          inputs: [["GNSS receiver", "Position and fix quality over serial"], ["Correction source", "RTCM from TCP or NTRIP"], ["Other crane rovers", "Timestamped peer fixes over UDP"]],
          inputLink: "Receiver, corrections, and peer data",
          system: "Raspberry Pi rover",
          components: [["GNSS and RTCM workers", "Read fixes and relay corrections to the receiver"], ["UDP and ranging", "Broadcast local fixes and estimate nearest-peer separation"]],
          outputLink: "Local status and optional MQTT telemetry",
          outputs: [["In-cab display", "Reads the rover's HTTP status API"], ["Blynk or local dashboard", "Receives monitoring telemetry"]],
        },
      },
      {
        title: "Operator Dashboard", repository: "operator-dashboard",
        summary: "A touchscreen in the crane cab that shows the estimated distance to the nearest reporting crane.",
        operation: "The display compares the estimate with a configured distance limit. It shows separate messages when Wi-Fi is down, the reading is invalid, or a nearby crane has stopped reporting.",
        architecture: {
          inputs: [["Crane Rover", "Distance estimate, rover and peer IDs, fix states"], ["Installer", "Rover address and display threshold over serial"]],
          inputLink: "HTTP over Wi-Fi and serial configuration",
          system: "ESP32-S3 operator display",
          components: [["Display firmware", "Polls rover status and determines the display state"], ["Flash preferences", "Retain address and threshold across restarts"]],
          outputLink: "Partial screen updates",
          outputs: [["In-cab touchscreen", "Distance, threshold status, fix quality, or a fault state"]],
        },
      },
      {
        title: "RTK Dashboard", repository: "rtk-dashboard",
        summary: "A browser dashboard that shows the locations and status of several cranes on one map. Staff can also look up earlier readings.",
        operation: "The service accepts messages from Crane Rover using its existing data format. It keeps individual recent readings and hourly summaries for longer periods.",
        architecture: {
          inputs: [["Crane rovers", "Existing batch telemetry over MQTT"], ["Peer broadcasts", "Optional UDP position and discovery messages"]],
          inputLink: "Local network",
          system: "Python monitoring service",
          components: [["MQTT and UDP listeners", "Ingest rover state and connection events"], ["SQLite", "Recent samples and hourly summaries"], ["HTTP service", "Serves live events and history"]],
          outputLink: "Server-sent events and HTTP queries",
          outputs: [["Browser dashboard", "Live map, per-rover status, and historical telemetry"]],
        },
      },
    ],
  },
  {
    category: fieldSystemCategories[2],
    projects: [
      {
        title: "RTKBox", repository: "rtkbox",
        summary: "A Raspberry Pi toolkit for improving satellite positioning. It can set up a fixed receiver that sends correction data or a mobile receiver that uses it.",
        operation: "The toolkit can also save raw readings for later analysis. Before a fixed receiver publishes to a public service, RTKBox checks that it is producing usable correction data.",
        architecture: {
          inputs: [["ZED-F9P receiver", "Serial observations or position messages"], ["Correction source", "TCP or NTRIP in rover mode"], ["Installer", "Mode selection through the local web panel or CLI"]],
          inputLink: "Serial, network, and configuration",
          system: "RTKBox on Raspberry Pi",
          components: [["Mode controller", "Selects base, rover, bridge, or recording"], ["RTKLIB stream tools", "Route or convert correction data"], ["Raw recorder", "Writes UBX observation files"]],
          outputLink: "Mode-specific outputs",
          outputs: [["TCP or NTRIP", "Correction stream in base mode"], ["ZED-F9P serial port", "Receives corrections in rover mode"], ["Receiver tools and files", "TCP configuration bridge and UBX recordings"]],
        },
      },
      {
        title: "RTCM Forwarder", repository: "rtcm-forwarder",
        summary: "A relay that takes positioning corrections from one satellite receiver and sends them to devices on the local network or to an online service.",
        operation: "The relay checks each correction message and passes on valid ones. It reconnects if the receiver is unplugged or the connection to the online service drops.",
        architecture: {
          inputs: [["GNSS receiver", "RTCM corrections and NMEA text over serial"], ["ESP32 configuration port", "Separate serial channel for diagnostics"]],
          inputLink: "USB serial",
          system: "Python forwarder on Raspberry Pi",
          components: [["RTCM parser", "Validates frames and separates binary corrections from text"], ["Network outputs", "Distribute corrections to TCP clients and NTRIP"], ["Serial console and logs", "Expose both serial ports and service status"]],
          outputLink: "Correction delivery and diagnostics",
          outputs: [["LAN clients", "Read the local TCP correction stream"], ["NTRIP caster", "Receives corrections for a mountpoint"], ["Browser console", "Inspect logs and exchange serial commands"]],
        },
      },
      {
        title: "MikroPy RTK",
        summary: "A portable survey kit that records the coordinates of points on site. It can also serve as a fixed station that sends positioning corrections.",
        operation: "The browser interface switches modes, shows positioning status, and exports survey points as a CSV file. The kit can start its own Wi-Fi hotspot where there is no available saved network.",
        architecture: {
          inputs: [["Q43 GNSS receiver", "Position, heading, and correction activity"], ["Field operator", "Local Wi-Fi, fallback hotspot, or Bluetooth serial access"]],
          inputLink: "Receiver serial and local control",
          system: "Raspberry Pi field controller",
          components: [["Web controller", "Selects base or rover mode and shows receiver status"], ["Network services", "Manage local access and hotspot fallback"], ["Survey point store", "Saves points for CSV export"]],
          outputLink: "Mode-specific outputs",
          outputs: [["Base mode", "Correction stream"], ["Rover mode", "Position and survey points"], ["Field interface", "Browser status and CSV download"]],
        },
      },
    ],
  },
  {
    category: fieldSystemCategories[3],
    projects: [
      {
        title: "Weather Station",
        summary: "An outdoor station that measures wind, rainfall, temperature, humidity, and air pressure. A browser dashboard shows current conditions and past readings.",
        operation: "The station saves readings locally when Wi-Fi is down and sends them when it reconnects. The server recognizes repeat deliveries so a retry does not count the same rainfall twice.",
        architecture: {
          inputs: [["Wind and rain sensors", "Anemometer, direction vane, and rain gauge"], ["Atmospheric sensors", "Temperature, humidity, and pressure"]],
          inputLink: "Pulses, vane readings, and sensor measurements",
          system: "Station and server",
          components: [["ESP32-S3 firmware", "Samples sensors and queues undelivered observations in flash"], ["MQTT over Wi-Fi", "Carries readings and saved-record acknowledgements"], ["Python service and SQLite", "Validate, deduplicate, and store observations"]],
          outputLink: "Current conditions and historical data",
          outputs: [["React dashboard", "Live readings, trends, and coverage gaps"]],
        },
      },
      {
        title: "Tide Logger", repository: "tide-logger",
        summary: "A solar-powered water-level recorder. A sensor mounted above the water measures how far away the surface is.",
        operation: "The logger filters several readings and uses the sensor’s known height to calculate water level. It saves each reading before upload and keeps the original timestamp if it has to send the reading later.",
        architecture: {
          inputs: [["Ultrasonic sensor", "Distance from sensor to water surface"], ["Environmental and power sensors", "Temperature, humidity, and solar and battery readings"]],
          inputLink: "Serial distance and I²C measurements",
          system: "ESP32-S3 tide logger",
          components: [["Measurement firmware", "Filters distance, calculates water level, and schedules sleep"], ["LittleFS queue", "Keeps timestamped observations until delivery is acknowledged"]],
          outputLink: "Wi-Fi uploads and delivery acknowledgements",
          outputs: [["Blynk dashboard", "Water level, diagnostics, and maintenance controls"], ["MQTT destination", "Optional second delivery path"]],
        },
      },
    ],
  },
];

function ArchitectureNodes({ nodes }: { nodes: readonly Component[] }) {
  return (
    <ul className="work-architecture-nodes">
      {nodes.map(([name, detail]) => (
        <li key={name}><strong>{name}</strong><span>{detail}</span></li>
      ))}
    </ul>
  );
}

function ProjectArchitecture({ architecture }: { architecture: Architecture }) {
  return (
    <figure className="work-architecture">
      <figcaption>System architecture</figcaption>
      <ArchitectureNodes nodes={architecture.inputs} />
      <div className="work-architecture-link">{architecture.inputLink}</div>
      <div className="work-architecture-system">
        <strong>{architecture.system}</strong>
        <ArchitectureNodes nodes={architecture.components} />
      </div>
      <div className="work-architecture-link">{architecture.outputLink}</div>
      <ArchitectureNodes nodes={architecture.outputs} />
    </figure>
  );
}

export default function FieldSystems({ sectionId }: { sectionId?: string }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Field systems · Mustafa Turner";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const target = sectionId ? document.getElementById(sectionId) : heading.current;
    target?.focus({ preventScroll: true });
    if (sectionId) {
      target?.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [sectionId]);

  return (
    <main className="portfolio-wrap portfolio-work">
      <header className="portfolio-work-intro">
        <h1 ref={heading} tabIndex={-1}>Field systems</h1>
        <p>Hardware and software for fleet tracking, crane positioning, and environmental monitoring.</p>
      </header>
      {workGroups.map(({ category: { id, title }, projects }) => (
        <section className="portfolio-work-group" key={id} aria-labelledby={id}>
          <h2 id={id} tabIndex={-1}>{title}</h2>
          {projects.map(({ title, repository, summary, operation, architecture }) => (
            <article className="portfolio-work-project" key={title}>
              <h3>{title}</h3>
              <div className="work-project-copy">
                <p className="work-project-summary">{summary}</p>
                <p>{operation}</p>
                {repository ? (
                  <a href={`https://github.com/mustafa-turner/${repository}`} aria-label={`${title} source on GitHub`}>
                    Source on GitHub
                  </a>
                ) : (
                  <p className="portfolio-work-private">Private repository</p>
                )}
              </div>
              <ProjectArchitecture architecture={architecture} />
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
