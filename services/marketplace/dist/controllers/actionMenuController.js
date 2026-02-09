"use strict";
/**
 * Action menu config - admin-editable. Stored in YAML.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionMenuConfig = getActionMenuConfig;
exports.updateActionMenuConfig = updateActionMenuConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const DEFAULT_CONFIG = {
    title: 'Share transcript',
    description: 'Share your transcript for job matching',
    items: [
        { title: 'Share transcript', description: 'Share your transcript credential for job matching' },
        { title: 'Browse jobs', description: 'Discover jobs that match your skills' },
    ],
    presentationRequestCredentialTypes: ['CollegeTranscript', 'HighSchoolTranscript', 'Diploma', 'StudentCard'],
};
function getConfigPath() {
    const candidates = [
        path.join(__dirname, '../../config/action-menu.yaml'),
        path.join(process.cwd(), 'config/action-menu.yaml'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p))
            return p;
    }
    return candidates[0];
}
function getActionMenuConfig() {
    const configPath = getConfigPath();
    try {
        if (fs.existsSync(configPath)) {
            const contents = fs.readFileSync(configPath, 'utf8');
            const data = yaml.load(contents);
            return {
                ...DEFAULT_CONFIG,
                ...data,
                items: data.items ?? DEFAULT_CONFIG.items,
                presentationRequestCredentialTypes: data.presentationRequestCredentialTypes ?? DEFAULT_CONFIG.presentationRequestCredentialTypes,
            };
        }
    }
    catch {
        // fall through to default
    }
    return DEFAULT_CONFIG;
}
function updateActionMenuConfig(config) {
    const configPath = getConfigPath();
    const merged = {
        ...DEFAULT_CONFIG,
        ...config,
        items: config.items ?? DEFAULT_CONFIG.items,
        presentationRequestCredentialTypes: config.presentationRequestCredentialTypes ?? DEFAULT_CONFIG.presentationRequestCredentialTypes,
    };
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, yaml.dump(merged), 'utf8');
    return merged;
}
