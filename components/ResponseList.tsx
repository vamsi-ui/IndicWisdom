import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WisdomResponse } from '../types';
import { Share2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ResponseListProps {
    responses: WisdomResponse[];
    onSelect: (response: WisdomResponse) => void;
    onRetry?: (response: WisdomResponse) => void;
}

// Cluster responses by similarity
const clusterResponses = (responses: WisdomResponse[]) => {
    const clusters: WisdomResponse[][] = [];
    const visited = new Set<number>();

    const tokenize = (text: string) => new Set(text.toLowerCase().split(/\s+/));

    for (let i = 0; i < responses.length; i++) {
        if (visited.has(i)) continue;

        const currentCluster = [responses[i]];
        visited.add(i);

        const setA = tokenize(responses[i].content);

        for (let j = i + 1; j < responses.length; j++) {
            if (visited.has(j)) continue;

            const setB = tokenize(responses[j].content);
            const intersection = new Set([...setA].filter(x => setB.has(x)));
            const union = new Set([...setA, ...setB]);

            if (intersection.size / union.size > 0.6) { // 60% similarity threshold
                currentCluster.push(responses[j]);
                visited.add(j);
            }
        }
        clusters.push(currentCluster);
    }
    return clusters;
};

export const ResponseList: React.FC<ResponseListProps> = ({ responses, onSelect, onRetry }) => {
    const clusters = clusterResponses(responses);
    const [visibleCount, setVisibleCount] = useState(4); // Show 4 clusters initially
    const showMore = () => setVisibleCount(prev => Math.min(prev + 4, clusters.length));

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-8 pb-24">
            <h2 className="text-2xl font-serif text-center text-stone-800 dark:text-stone-100">
                Eight Paths to Wisdom
            </h2>

            {/* Mobile Friendliness: grid-cols-1 by default (List View), grid-cols-2 on tablet, 4 on desktop */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {clusters.slice(0, visibleCount).map((cluster, clusterIndex) => (
                    <motion.div
                        key={clusterIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: clusterIndex * 0.1 }}
                        className="flex flex-col h-full"
                    >
                        <div className="
               flex-1 flex flex-col
               bg-white dark:bg-stone-800
               rounded-3xl p-6
               border border-teal-100 dark:border-stone-700
               shadow-lg shadow-teal-500/5 dark:shadow-black/20
               hover:shadow-xl hover:shadow-teal-500/10
               hover:-translate-y-1 transition-all duration-300
               group relative overflow-hidden
             ">
                            {/* Decorative Top Border */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cluster.length > 1 ? 'from-indigo-400 to-purple-500' : 'from-teal-400 to-emerald-500'}`} />

                            {/* Header: Model Names */}
                            <div className="flex flex-wrap gap-2 mb-4 mt-2">
                                {cluster.map((resp, idx) => (
                                    <span key={idx} className="text-[10px] font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1 rounded-full border border-teal-100 dark:border-teal-800/50">
                                        {resp.modelName?.split(' ')[0] || 'AI'}
                                    </span>
                                ))}
                                {cluster.length > 1 && (
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1">
                                        <Share2 size={8} /> Combined
                                    </span>
                                )}
                            </div>

                            {/* Content - Show first response text */}
                            <p className="text-base text-stone-700 dark:text-stone-300 font-serif leading-relaxed flex-grow">
                                {cluster[0].content}
                            </p>

                            {/* If clustered, show mention */}
                            {cluster.length > 1 && (
                                <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 italic">
                                    + {cluster.length - 1} similar perspective(s) merged.
                                </p>
                            )}

                            <div className="mt-6 flex gap-3">
                                <button
                                    className="flex-1 py-2 rounded-lg border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                    onClick={() => onRetry && onRetry(cluster[0])}
                                >
                                    <RefreshCw size={14} />
                                    <span>Retry</span>
                                </button>

                                <button
                                    onClick={() => onSelect(cluster[0])}
                                    className="flex-[2] py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 size={14} />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* View More Button */}
            {visibleCount < clusters.length && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={showMore}
                        className="px-6 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-stone-600 dark:text-stone-300 font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                    >
                        View More Responses ({clusters.length - visibleCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
};
