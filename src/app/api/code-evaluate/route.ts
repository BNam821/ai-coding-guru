import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { recordProblemScore } from "@/lib/coding-problems-service";

function normalizeCode(value: string) {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/^\s+|\s+$/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n");
}

function parseZeroScoreStreak(value: unknown) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return 0;
    }

    return Math.floor(parsedValue);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            userCode,
            problemObj,
            exerciseType,
            starterCode,
            bugChangeSummary,
            zeroScoreStreakBeforeSubmission,
        } = body;

        if (!userCode || !problemObj) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const isFixBugExercise = exerciseType === "fix_bug";
        const previousZeroScoreStreak = parseZeroScoreStreak(zeroScoreStreakBeforeSubmission);
        const submittedUnchangedStarterCode = isFixBugExercise
            && typeof starterCode === "string"
            && normalizeCode(userCode) === normalizeCode(starterCode);

        const exerciseLabel = exerciseType === "fix_bug" ? "Sua loi code" : "Hoan thien code";
        const exerciseInstructions = exerciseType === "fix_bug"
            ? `Day la dang bai SUA LOI CODE.
Hoc sinh bat dau tu mot phien ban code gan hoan chinh nhung da bi AI co y gay loi o muc co ban.

Code khoi diem:
${starterCode || "(Khong co)"}

Thong tin noi bo ve thay doi da gay loi:
${bugChangeSummary || "(Khong xac dinh duoc cu the)"}

Quy tac bo sung rieng cho dang nay:
- Neu bai nop van giu nguyen code loi ban dau, hoac chi sua rat hinh thuc ma chua debug logic that su, phai cham 0 diem.
- Trong feedback va suggestion, TUYET DOI KHONG duoc tiet lo expected output, ket qua cuoi cung, dap an dung day du, hay dua ra phien ban code da sua hoan chinh, TRU truong hop mo khoa duoc mo ta ben duoi.
- Khong duoc them comment vao bat ky doan code nao duoc tao ra, duoc trich dan, hoac duoc goi y. Tuyet doi tranh cac comment kieu "BUG", "TODO", "fix here", hoac mo ta truc tiep cach sua.
- Chi duoc mo ta theo huong debug: vi tri nao dang dang nghi, dieu kien nao can kiem tra, buoc xu ly nao can xem lai, va cach tu kiem chung sau khi sua.
- Khong duoc viet bat ky cau nao tiet lo truc tiep chuong trinh dung se in ra gi.
- Neu truoc lan nop nay hoc sinh da co it nhat 2 lan lien tiep bi 0 diem cho cung bai nay, va ban tiep tuc cham lan nay la 0 diem, ban DUOC PHEP dua ra dap an dung o phan suggestion duoi dang mot doan code mau.
- Tuy nhien, khi mo khoa dap an code mau, bat buoc phai:
  1. Giai thich chi tiet thuat toan bang tieng Viet co dau truoc.
  2. Giai thich vi sao huong sua nay dung, diem can chu y, va cach doi chieu voi de bai.
  3. Chi sau phan giai thich moi duoc dua code mau.
  4. Doan code mau khong duoc chua comment bat ky dang nao.
  5. Khong duoc chi dua code ma khong giai thich.`
            : `Day la dang bai HOAN THIEN CODE. Hoc sinh nhan skeleton code va tu dien phan con thieu de giai bai.
- Neu can neu vi du code trong feedback hoac suggestion, khong duoc them comment tiet lo dap an hoac huong giai.`;

        const prompt = `Ban la he thong AI cham bai lap trinh chuyen nghiep va rat nghiem khac.
Nhiem vu cua ban la danh gia ma nguon dua tren viec MO PHONG ket qua that su cua chuong trinh, khong duoc tu suy dien output neu ma nguon khong tao ra output do.

DANG BAI:
${exerciseLabel}

HUONG DAN THEO DANG BAI:
${exerciseInstructions}

DE BAI:
${problemObj.description}

DAP AN CHUAN (chi de tham khao logic):
${problemObj.solution_code}

INPUT:
${problemObj.expected_input || "(Khong co dau vao)"}

EXPECTED OUTPUT:
${problemObj.expected_output}

MA NGUON CUA HOC SINH:
${userCode}

TRANG THAI DOI CHIEU VOI CODE KHOI DIEM:
${isFixBugExercise ? `- Bai nop co trung nguyen code loi ban dau khong: ${submittedUnchangedStarterCode ? "CO" : "KHONG"}` : "- Khong ap dung"}

SO LAN 0 DIEM LIEN TIEP TRUOC LAN NOP NAY:
${isFixBugExercise ? previousZeroScoreStreak : 0}

--- QUY TAC BAT BUOC ---
1. Truoc khi cham diem, phai kiem tra xem trong code co lenh in ket qua hay khong (cout, printf, print, println, console.log...).
   - Neu KHONG CO lenh in, "actualOutput" bat buoc la "" hoac "Ma nguon khong in ket qua".
   - Tuyet doi khong duoc tu dien expected output vao "actualOutput" neu code khong thuc hien lenh in gia tri do.
2. Neu hoc sinh hardcode ket qua thay vi tinh toan, cham 0 diem.
3. Danh gia dung logic bai toan, khong chi doi chieu may moc voi dap an mau. Chap nhan cach giai khac neu dung va hop ly.
4. Neu bai toan can lap lai mot mau xu ly ma hoc sinh in thu cong thay vi dung vong lap, chi cham toi da 40 diem du output dung.
5. Danh gia do phuc tap thoi gian.
   - Neu bai lam cham hon dang ke so voi muc toi uu hop ly, tru truc tiep 50 diem khoi muc diem dang le dat duoc.
6. Trong moi truong hop, khong duoc them comment vao bat ky doan code nao xuat hien trong phan hoi.
7. Neu dang bai la "Sua loi code":
   - Neu bai nop cho thay hoc sinh chua debug that su va van de logic loi cot loi chua duoc xu ly, uu tien cham 0 diem thay vi cham nong tay.
   - Neu bai nop trung nguyen code khoi diem loi, score bat buoc la 0.
   - Feedback/suggestion khong duoc tiet lo expected output, khong duoc noi ket qua cuoi cung dung la gi, khong dua dap an code hoan chinh, tru khi du dieu kien mo khoa dap an.
   - Khong duoc chen comment vao code, khong duoc goi y sua bang cach viet comment ngay trong code.
   - Chi duoc dua ra nhan xet theo huong goi mo debug, mo ta loi, va cach kiem tra lai.
   - CHI KHI previousZeroScoreStreak >= 2 va sau khi danh gia lan nay ban van cham 0 diem, ban moi duoc phep dua ra dap an dung o phan suggestion.
   - Khi da duoc phep dua dap an dung, ban bat buoc giai thich thuat toan chi tiet bang tieng Viet co dau truoc, sau do moi dua code mau khong comment.
   - Neu chua du dieu kien mo khoa dap an, tuyet doi khong dua code mau dung.

--- THANG DIEM ---
- 0 diem: gian lan, thuat toan sai nghiem trong, hoac sai va khong co output.
- 20 diem: logic co the dung nhung thieu lenh in ket qua cuoi cung.
- 40 diem: output dung nhung cach lam thu cong, khong dung cau truc phu hop nhu vong lap khi bai can.
- 50-90 diem: thuat toan co huong dung nhung sai output, sai dinh dang, sai mot phan logic, hoac bi tru do do phuc tap.
- 100 diem: logic dung, co output dung, cau truc va do phuc tap dat muc hop ly.

--- YEU CAU PHAN TICH ---
Buoc 1: Liet ke cac lenh in ket qua tim thay trong code.
Buoc 2: Mo phong code voi input duoc cung cap. Neu khong co lenh in, actual output la rong.
Buoc 3: So sanh actual output voi expected output.
Buoc 4: Danh gia logic va cham diem.
Buoc 5: Neu la dang "Sua loi code", feedback va suggestion can noi theo ngu canh debug, khong mo ta nhu dang hoc sinh viet tu dau, va khong tiet lo dap an/cuoi cung, tru khi da du dieu kien mo khoa dap an.

--- DINH DANG PHAN HOI ---
Tra ve duy nhat mot JSON object hop le:
{
  "actualOutput": "...",
  "score": 0,
  "feedback": "...",
  "suggestion": "..."
}

Yeu cau them:
- "feedback" viet bang tieng Viet CO DAU, ngan gon, ro rang, tu nhien, khong duoc viet khong dau.
- "suggestion" viet bang tieng Viet CO DAU, tu nhien, de hieu, khong duoc viet khong dau.
- Neu diem < 100, dua ra huong sua cu the. Neu la dang "Sua loi code", tap trung vao buoc debug va vi tri logic can sua.
- Neu la dang "Sua loi code", ca "feedback" lan "suggestion" deu KHONG duoc chua expected output, dap an cuoi cung, code da sua xong, hay bat ky ket qua cu the nao cua chuong trinh dung, tru khi da du dieu kien mo khoa dap an.
- Neu da du dieu kien mo khoa dap an va ban dua code mau, suggestion bat buoc co 2 phan ro rang:
  1. Giai thich chi tiet thuat toan bang tieng Viet co dau.
  2. Doan code mau dung khong comment.
- Khong duoc tra ve code co comment trong bat ky truong nao.
- Neu diem = 100, tra ve chinh xac cau: "Bạn đã đạt điểm tuyệt đối! Tôi không có gì cần góp ý cho đoạn code này cả."`;

        const result = await geminiModel.generateContent(prompt);
        const textArea = result.response.text();

        let cleanJson = textArea.trim();
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        const parsedData = JSON.parse(cleanJson);
        const finalData = {
            ...parsedData,
            score: submittedUnchangedStarterCode ? 0 : (parsedData.score || 0),
        };

        if (submittedUnchangedStarterCode && !finalData.feedback) {
            finalData.feedback = "Bạn đang nộp lại nguyên trạng đoạn code lỗi ban đầu, nên bài này được chấm 0 điểm.";
        }

        const session = await getSession();
        if (session && session.username && problemObj.id) {
            await recordProblemScore(session.username, problemObj.id, finalData.score || 0);
        }

        return NextResponse.json(finalData);
    } catch (error) {
        console.error("Lỗi khi chấm bài code:", error);
        return NextResponse.json(
            {
                actualOutput: "Lỗi hệ thống hoặc lỗi thực thi AI.",
                score: 0,
                feedback: "Hệ thống AI không phản hồi JSON tiêu chuẩn hoặc máy chủ gặp vấn đề.",
            },
            { status: 500 }
        );
    }
}
