"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Chart } from "react-google-charts";
import type { DashboardAiRawChartData } from "@/lib/dashboard-ai-evaluation";

type DashboardAiChartsPageProps = {
    chartData: DashboardAiRawChartData;
};

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-white/20 bg-[#0f0f10] px-4 py-8 text-sm leading-6 text-white/46">
            {message}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="rounded-[1.3rem] border border-white/16 bg-[linear-gradient(180deg,rgba(19,21,24,0.98),rgba(12,13,15,0.98))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-2 text-sm leading-6 text-white/46">{hint}</p>
        </div>
    );
}

function PieChartCard({
    title,
    description,
    data,
    colors,
    pieHole = 0.54,
}: {
    title: string;
    description: string;
    data: (string | number)[][];
    colors: string[];
    pieHole?: number;
}) {
    if (data.length <= 1) {
        return <EmptyState message="Chưa có đủ dữ liệu câu trả lời gần đây để dựng biểu đồ này. Hãy hoàn thành thêm một quiz mới để hệ thống ghi nhận kết quả từng câu." />;
    }

    return (
        <div className="overflow-hidden rounded-[1.4rem] border border-white/16 bg-[linear-gradient(180deg,rgba(19,21,24,0.98),rgba(12,13,15,0.98))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/46">{description}</p>
            </div>

            <div className="overflow-hidden rounded-[1.15rem] border border-white/14 bg-[#0f1113] p-3">
                <Chart
                    chartType="PieChart"
                    width="100%"
                    height="360px"
                    data={data}
                    options={{
                        backgroundColor: "transparent",
                        colors,
                        chartArea: {
                            left: 24,
                            top: 20,
                            width: "92%",
                            height: "82%",
                        },
                        legend: {
                            position: "right",
                            textStyle: {
                                color: "#d9edf4",
                                fontSize: 12,
                            },
                        },
                        pieHole,
                        pieSliceTextStyle: {
                            color: "#0f1113",
                            fontSize: 12,
                            bold: true,
                        },
                        tooltip: {
                            text: "value",
                        },
                    }}
                />
            </div>
        </div>
    );
}

export function DashboardAiChartsPage({ chartData }: DashboardAiChartsPageProps) {
    const recentQuestionCount = chartData.summary.recentQuestionCount || 0;
    const recentCorrectAnswers = chartData.summary.recentCorrectAnswers || 0;
    const recentWrongAnswers = chartData.summary.recentWrongAnswers || 0;
    const recentAccuracyRate = recentQuestionCount > 0
        ? Math.round((recentCorrectAnswers / recentQuestionCount) * 100)
        : 0;

    const lessonWrongData: (string | number)[][] = [
        ["Bài học", "Số câu sai"],
        ...chartData.wrongByLesson.map((item) => [item.label, Math.round(item.value)]),
    ];

    const chapterWrongData: (string | number)[][] = [
        ["Chương", "Số câu sai"],
        ...chartData.wrongByChapter.map((item) => [item.label, Math.round(item.value)]),
    ];

    const recentAnswerData: (string | number)[][] = [
        ["Kết quả", "Số câu"],
        ["Đúng", recentCorrectAnswers],
        ["Sai", recentWrongAnswers],
    ].filter((item, index) => index === 0 || Number(item[1]) > 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#90defa]/20 bg-[#90defa]/10 px-3 py-1 text-xs font-medium text-[#c9f3ff]">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Google Charts
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Biểu đồ câu trả lời gần đây</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52">
                        Trang này tổng hợp trực tiếp các câu trả lời đúng và sai từ những lượt quiz gần đây đã lưu chi tiết từng câu, giúp bạn nhìn rõ bài học và chương đang cần ôn lại.
                    </p>
                </div>

                <Link
                    href="/dashboard?tab=learning"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại dashboard
                </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <SummaryCard
                    label="Câu gần đây"
                    value={`${recentQuestionCount}`}
                    hint="Tổng số câu đã có kết quả chi tiết để thống kê."
                />
                <SummaryCard
                    label="Đúng / Sai"
                    value={`${recentCorrectAnswers} / ${recentWrongAnswers}`}
                    hint="Số nguyên đếm trực tiếp từ các lượt làm quiz mới."
                />
                <SummaryCard
                    label="Độ chính xác"
                    value={`${recentAccuracyRate}%`}
                    hint="Tỷ lệ đúng trên tập câu trả lời gần đây đã ghi nhận."
                />
            </div>

            {recentQuestionCount === 0 ? (
                <EmptyState message="Chưa có dữ liệu câu trả lời chi tiết để chuyển biểu đồ sang số nguyên. Sau khi áp dụng SQL mới, chỉ cần làm thêm một quiz là Dashboard sẽ bắt đầu thống kê đúng/sai theo từng câu." />
            ) : null}

            <div className="grid gap-5 xl:grid-cols-2">
                <PieChartCard
                    title="Phân bố câu sai theo bài học"
                    description="Mỗi lát cắt là số câu trả lời sai gần đây gắn trực tiếp với một bài học."
                    data={lessonWrongData}
                    colors={["#fb7185", "#f97316", "#f59e0b", "#ef4444", "#fca5a5", "#fdba74", "#fcd34d", "#fecaca"]}
                />
                <PieChartCard
                    title="Phân bố câu sai theo chương"
                    description="Gom các câu sai theo chương để thấy cụm kiến thức nào đang là điểm nghẽn lớn nhất."
                    data={chapterWrongData}
                    colors={["#38bdf8", "#60a5fa", "#34d399", "#22c55e", "#2dd4bf", "#93c5fd", "#67e8f9", "#86efac"]}
                />
            </div>

            <PieChartCard
                title="Tỷ lệ đúng và sai của các câu gần đây"
                description="Biểu đồ donut tổng quát cho biết bạn đang trả lời đúng bao nhiêu câu và sai bao nhiêu câu trong tập dữ liệu gần đây."
                data={recentAnswerData}
                colors={["#5eead4", "#fb7185"]}
                pieHole={0.62}
            />
        </div>
    );
}
